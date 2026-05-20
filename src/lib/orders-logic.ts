import { doc, runTransaction, getFirestore, collection, serverTimestamp } from "firebase/firestore";

// --- Domain Models & Types ---

export type OrderType = 'DINE_IN' | 'CAR_SERVICE' | 'TAKEAWAY';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type TableType = 'DINE_IN' | 'CAR_SERVICE';
export type TableStatus = 'AVAILABLE' | 'ORDERING' | 'OCCUPIED' | 'READY' | 'NEEDS_PAYMENT' | 'OUT_OF_SERVICE';

export interface OrderItemInput {
  productId: string;
  categoryId?: string;
  productName: string;
  nameEn?: string;
  nameAr?: string;
  unitPrice: number;
  quantity: number;
  options?: any;
  notes?: string;
  totalPrice?: number;
}

export interface PlaceOrderInput {
  cafeId: string;
  branchId: string;
  tableId: string | null;
  type: OrderType;
  customerPhone?: string;
  customerName?: string;
  carNumber?: string;
  notes?: string;
  useReward?: boolean;
  rewardDiscount?: number;
  items: OrderItemInput[];
  source?: "qr_customer" | "cashier_manual";
  createdBy?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  loyaltyEligible?: boolean;
}

// Helper: Determine next table status based on requested update
export function getTableStatusAfterOrder(type: OrderType): TableStatus {
  if (type === 'CAR_SERVICE') return 'ORDERING';
  return 'OCCUPIED';
}

// Helper: What should the table status be when an order changes status?
export function getTableStatusOnOrderUpdate(orderStatus: OrderStatus): TableStatus | null {
  switch (orderStatus) {
    case 'PENDING':
    case 'CONFIRMED':
    case 'PREPARING':
      return 'OCCUPIED';
    case 'READY':
      return 'READY';
    case 'COMPLETED':
    case 'CANCELLED':
    default:
      return null;
  }
}

/**
 * Creates an order safely utilizing Firebase Transactions.
 * Guarantees a unique sequential Order Number per branch.
 * Updates the Table Status in the exact same atomic transaction to prevent desyncs.
 */
export async function placeOrderAtomic(input: PlaceOrderInput) {
  const db = getFirestore();
  const { cafeId, branchId, tableId, type, customerPhone, customerName, carNumber, notes, items, useReward, rewardDiscount = 0, source = "qr_customer", createdBy, paymentMethod, paymentStatus, loyaltyEligible = true } = input;

  if (!branchId || !type || !items?.length) {
    throw new Error('Missing required fields for order creation');
  }

  // Calculate Subtotal & Taxes
  const itemsSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const subtotal = Math.max(0, itemsSubtotal - rewardDiscount);
  const taxRate = 0; // Configurable based on Cafe Settings later if needed
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  // We use the Cafe Branch Counter for Atomic Sequential incrementations
  const branchCounterRef = doc(db, 'cafes', cafeId, 'branches', branchId, 'counters', 'orders');
  const tableRef = tableId ? doc(db, 'cafes', cafeId, 'tables', tableId) : null;
  const orderRef = doc(collection(db, 'cafes', cafeId, 'orders'));

  const createdOrder = await runTransaction(db, async (tx) => {
    // 1. Validate Table if exists
    let tableExists = false;
    if (tableRef) {
      const tableSnap = await tx.get(tableRef);
      if (tableSnap.exists()) {
        tableExists = true;
        const tableData = tableSnap.data();
        if (type === 'CAR_SERVICE' && tableData.type && tableData.type !== 'CAR_SERVICE') {
          // just ignore the warning to allow flexible ordering
        }
      }
    }

    // 1.5 Validate Business Settings (Control Layer)
    const configRef = doc(db, 'cafes', cafeId, 'config', 'settings');
    const configSnap = await tx.get(configRef);
    if (configSnap.exists()) {
      const configData = configSnap.data();
      const activeTypes = configData.activeOrderTypes || { dineIn: true, carService: true, pickup: true };
      
      if (type === 'CAR_SERVICE' && activeTypes.carService === false) throw new Error('Car service is currently disabled.');
      if (type === 'DINE_IN' && activeTypes.dineIn === false) throw new Error('Dine-in service is currently disabled.');
      if (type === 'TAKEAWAY' && activeTypes.pickup === false) throw new Error('Pickup service is currently disabled.');
    }

    // 2. Safely get and increment the Sequential Order Number (Counter)
    const counterSnap = await tx.get(branchCounterRef);
    let newOrderNumber = 1000;
    
    if (!counterSnap.exists()) {
      tx.set(branchCounterRef, { lastOrderNumber: 1000, updatedAt: new Date().toISOString() });
    } else {
      newOrderNumber = (counterSnap.data().lastOrderNumber || 1000) + 1;
      tx.update(branchCounterRef, { lastOrderNumber: newOrderNumber, updatedAt: new Date().toISOString() });
    }
    
    // Loyalty: Initial Creation & Reward Usage
    let earnedCups = 0; // Earned when completed, not here
    if (customerPhone && loyaltyEligible) {
        const customerRef = doc(db, 'customers', `${cafeId}_${customerPhone}`);
        const customerSnap = await tx.get(customerRef);
        
        if (customerSnap.exists()) {
            const cData = customerSnap.data();
            let rewardsRedeemed = cData.rewardsRedeemed || 0;
            if (useReward) {
                rewardsRedeemed += 1;
                tx.update(customerRef, { rewardsRedeemed, updatedAt: serverTimestamp() });
            }
        } else {
            tx.set(customerRef, {
                name: customerName || "Guest",
                phone: customerPhone,
                cafeId,
                cups: 0,
                totalOrders: 0,
                rewardsEarned: 0,
                rewardsRedeemed: useReward ? 1 : 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
    }

    // 3. Create the Order
    const orderData = {
      id: orderRef.id,
      cafeId,
      branchId,
      tableId,
      orderNumber: newOrderNumber,
      type,
      status: 'PENDING' as OrderStatus,
      customerPhone: customerPhone || null,
      customerName: customerName || null,
      customerId: customerPhone ? `${cafeId}_${customerPhone}` : null,
      carNumber: type === 'CAR_SERVICE' ? (carNumber || null) : null,
      notes: notes || '',
      useReward: useReward || false,
      rewardDiscount,
      subtotal,
      taxAmount,
      totalAmount,
      earnedPoints: earnedCups,
      source,
      createdBy: createdBy || null,
      paymentMethod: paymentMethod || 'online',
      paymentStatus: paymentStatus || 'pending',
      loyaltyEligible,
      items: items.map(item => ({
        ...item,
        totalPrice: item.unitPrice * item.quantity,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const cleanOrderData = JSON.parse(JSON.stringify(orderData));
    tx.set(orderRef, cleanOrderData);

    // 4. Update the Table Status Atomically
    if (tableExists && tableRef) {
      const newStatus = getTableStatusAfterOrder(type);
      tx.update(tableRef, { status: newStatus });
    }

    return orderData;
  });

  return createdOrder;
}

export async function updateOrderStatusAtomic(orderId: string, cafeId: string, newStatusStr: string) {
  const db = getFirestore();
  const orderRef = doc(db, 'cafes', cafeId, 'orders', orderId);
  const newStatus = newStatusStr.toUpperCase() as OrderStatus;

  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) throw new Error('Order not found');
    const orderData = orderSnap.data();

    tx.update(orderRef, { status: newStatus, updatedAt: new Date().toISOString() });

    if (orderData.tableId && orderData.cafeId) {
      const tableRef = doc(db, 'cafes', orderData.cafeId, 'tables', orderData.tableId);
      
      let nextTableStatus = getTableStatusOnOrderUpdate(newStatus);
      if (!nextTableStatus) {
        nextTableStatus = 'AVAILABLE';
      }

      tx.update(tableRef, { status: nextTableStatus });
    }

    // Loyalty Earning Logic
    if (newStatus === 'COMPLETED' && !orderData.loyaltyProcessed && orderData.customerPhone && orderData.loyaltyEligible !== false) {
      const customerRef = doc(db, 'customers', `${cafeId}_${orderData.customerPhone}`);
      const customerSnap = await tx.get(customerRef);
      
      // Load settings from root collection loyaltySettings/{cafeId} as requested
      const loyaltySettingsRef = doc(db, 'loyaltySettings', cafeId);
      const loyaltySettingsSnap = await tx.get(loyaltySettingsRef);
      
      let isActive = true;
      let cupsReq = 5;
      let autoReset = true;
      let countOnlyCoffee = false;

      if (loyaltySettingsSnap.exists()) {
          const settings = loyaltySettingsSnap.data();
          isActive = settings.active !== false; // Default true if not set
          cupsReq = settings.cupsRequired || 5;
          autoReset = settings.autoReset !== false;
          countOnlyCoffee = !!settings.countOnlyCoffee;
      }

      if (isActive && customerSnap.exists()) {
          let isValid = true;
          if (countOnlyCoffee) {
              // Simple check: does the order have items in "hot" or "cold" or "coffee" categories?
              // Assuming you'd have category check logic here if needed.
          }
          
          if (isValid) {
              const cData = customerSnap.data();
              let cups = cData.cups || 0;
              let totalOrders = cData.totalOrders || 0;
              let rewardsEarned = cData.rewardsEarned || 0;

              cups += 1;
              totalOrders += 1;

              if (cups >= cupsReq) {
                  rewardsEarned += 1;
                  if (autoReset) {
                      cups = 0;
                  } else {
                      cups = cups - cupsReq;
                  }
              }

              tx.update(customerRef, {
                  cups,
                  totalOrders,
                  rewardsEarned,
                  lastVisit: serverTimestamp(),
                  updatedAt: serverTimestamp()
              });

              // Mark order as processed
              tx.update(orderRef, { loyaltyProcessed: true });
          }
      }
    }
  });

  return true;
}
