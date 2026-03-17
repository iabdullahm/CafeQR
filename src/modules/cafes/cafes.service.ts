/**
 * @fileOverview Cafe Service handles cafe-related business logic and database interactions.
 */

export class CafeService {
  private mockCafes = [
    { 
      id: 1,
      uuid: "caf-001-uuid", 
      cafe_code: "CAF-001",
      name: "Brew Corner", 
      city: "Muscat",
      status: "active", 
      owner_name: "Ahmed Al Balushi",
      plan_name: "Premium",
      subscription_end_date: "2026-04-16",
      branches_count: 1,
      tables_count: 10,
      orders_count: 142
    },
    { 
      id: 2,
      uuid: "caf-002-uuid", 
      cafe_code: "CAF-002",
      name: "Qahwa House", 
      city: "Muscat",
      status: "trial", 
      owner_name: "Ahmed Al Balushi",
      plan_name: "Standard",
      subscription_end_date: "2024-12-14",
      branches_count: 1,
      tables_count: 0,
      orders_count: 0
    }
  ];

  async findAll(params: { search?: string; status?: string; city?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    let filtered = [...this.mockCafes];
    
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(s) || 
        c.cafe_code.toLowerCase().includes(s) ||
        c.owner_name.toLowerCase().includes(s)
      );
    }

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(c => c.status === params.status);
    }

    if (params.city) {
      filtered = filtered.filter(c => c.city.toLowerCase() === params.city?.toLowerCase());
    }

    // Sort
    const sortBy = (params.sortBy || 'id') as keyof typeof this.mockCafes[0];
    filtered.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA < valB) return params.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return params.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const start = ((params.page || 1) - 1) * (params.limit || 10);
    const paginatedData = filtered.slice(start, start + (params.limit || 10));

    return {
      data: paginatedData,
      total,
      page: params.page || 1,
      limit: params.limit || 10
    };
  }

  async findById(id: string) {
    // Find by ID or UUID
    return this.mockCafes.find(c => String(c.id) === id || c.uuid === id);
  }

  async create(data: any) {
    const newId = this.mockCafes.length + 1;
    const newCafe = {
      ...data,
      id: newId,
      uuid: crypto.randomUUID(),
      owner_name: "New Owner", // Mocking owner resolution
      plan_name: "Trial",
      subscription_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      branches_count: 0,
      tables_count: 0,
      orders_count: 0,
      joined_at: new Date().toISOString()
    };
    this.mockCafes.push(newCafe);
    return newCafe;
  }

  async update(id: string, data: any) {
    const index = this.mockCafes.findIndex(c => String(c.id) === id || c.uuid === id);
    if (index === -1) throw new Error('Cafe not found');
    this.mockCafes[index] = { ...this.mockCafes[index], ...data };
    return this.mockCafes[index];
  }

  async updateStatus(id: string, status: string) {
    const index = this.mockCafes.findIndex(c => String(c.id) === id || c.uuid === id);
    if (index === -1) throw new Error('Cafe not found');
    this.mockCafes[index].status = status;
    return this.mockCafes[index];
  }
}

export const cafeService = new CafeService();
