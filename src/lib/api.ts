const API_BASE_URL = 'https://autopart-api.mkaindo.com';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string, role: string = 'admin') {
    return this.request<{ user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  async logout() {
    this.setToken(null);
  }

  // Products
  async getProducts(page = 0, limit = 20) {
    return this.request<{ data: any[]; count: number }>(`/products?page=${page}&limit=${limit}`);
  }

  async getAllProducts() {
    return this.request<{ data: any[] }>('/products/all');
  }

  async getLowStockProducts() {
    return this.request<{ data: any[] }>('/products/low-stock');
  }

  async searchProducts(query: string, category?: string) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category && category !== 'all') params.set('category', category);
    return this.request<{ data: any[] }>(`/products/search?${params}`);
  }

  async createProduct(data: any) {
    return this.request<{ data: any }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request<{ data: any }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request<void>(`/products/${id}`, { method: 'DELETE' });
  }

  async uploadProductImage(productId: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return this.request<{ url: string }>(`/products/${productId}/image`, {
      method: 'POST',
      body: formData,
    });
  }

  async checkBarcode(barcode: string, excludeId?: string) {
    const params = new URLSearchParams({ barcode });
    if (excludeId) params.set('excludeId', excludeId);
    return this.request<{ exists: boolean }>(`/products/check-barcode?${params}`);
  }

  async importProducts(products: any[]) {
    return this.request<{ success: number; updated: number; failed: number; errors: any[] }>('/products/import', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });
  }

  // Transactions
  async getTransactions() {
    return this.request<{ data: any[] }>('/transactions');
  }

  async createTransaction(data: any) {
    return this.request<{ data: any }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: string, data: any) {
    return this.request<{ data: any }>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string) {
    return this.request<void>(`/transactions/${id}`, { method: 'DELETE' });
  }

  // Income & Expenses
  async getIncomeExpenses() {
    return this.request<{ data: any[] }>('/income-expenses');
  }

  async createIncomeExpense(data: any) {
    return this.request<{ data: any }>('/income-expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIncomeExpense(id: string, data: any) {
    return this.request<{ data: any }>(`/income-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIncomeExpense(id: string) {
    return this.request<void>(`/income-expenses/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
