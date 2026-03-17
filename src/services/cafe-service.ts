
import { type Cafe } from '@/lib/db-types';

export class CafeService {
  private mockCafes: any[] = [
    { 
      id: "1", 
      uuid: "caf-001-uuid", 
      cafe_code: "CAF-001",
      name: "Brew Corner", 
      city: "Muscat",
      status: "active", 
      joined_at: new Date().toISOString()
    }
  ];

  async findAll(params: { search?: string; status?: string; page?: number; limit?: number }) {
    // Mocking pagination and filtering
    let filtered = [...this.mockCafes];
    if (params.search) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(params.search!.toLowerCase()));
    }
    return {
      data: filtered,
      total: filtered.length,
      page: params.page || 1,
      limit: params.limit || 10
    };
  }

  async findById(id: string) {
    return this.mockCafes.find(c => c.id === id || c.uuid === id);
  }

  async create(data: any) {
    const newCafe = { ...data, id: String(this.mockCafes.length + 1), uuid: crypto.randomUUID(), joined_at: new Date().toISOString() };
    this.mockCafes.push(newCafe);
    return newCafe;
  }

  async update(id: string, data: any) {
    const index = this.mockCafes.findIndex(c => c.id === id || c.uuid === id);
    if (index === -1) return null;
    this.mockCafes[index] = { ...this.mockCafes[index], ...data };
    return this.mockCafes[index];
  }
}

export const cafeService = new CafeService();
