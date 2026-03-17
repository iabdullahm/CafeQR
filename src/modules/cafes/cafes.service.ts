/**
 * @fileOverview Cafe Service handles cafe-related business logic and database interactions.
 */

export class CafeService {
  private mockCafes = [
    { 
      uuid: "caf-001-uuid", 
      cafe_code: "CAF-001",
      name: "Brew Corner", 
      city: "Muscat",
      status: "active", 
      joined_at: new Date().toISOString(),
      owner: "Ahmed Al Balushi"
    },
    { 
      uuid: "caf-002-uuid", 
      cafe_code: "CAF-002",
      name: "Qahwa House", 
      city: "Muscat",
      status: "trial", 
      joined_at: new Date().toISOString(),
      owner: "Ahmed Al Balushi"
    }
  ];

  async findAll(params: { search?: string; status?: string; page?: number; limit?: number }) {
    let filtered = [...this.mockCafes];
    
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(s) || 
        c.cafe_code.toLowerCase().includes(s)
      );
    }

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(c => c.status === params.status);
    }

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
    return this.mockCafes.find(c => c.uuid === id);
  }

  async create(data: any) {
    const newCafe = {
      ...data,
      uuid: crypto.randomUUID(),
      joined_at: new Date().toISOString()
    };
    this.mockCafes.push(newCafe);
    return newCafe;
  }

  async updateStatus(id: string, status: string) {
    const index = this.mockCafes.findIndex(c => c.uuid === id);
    if (index === -1) throw new Error('Cafe not found');
    this.mockCafes[index].status = status;
    return this.mockCafes[index];
  }
}

export const cafeService = new CafeService();
