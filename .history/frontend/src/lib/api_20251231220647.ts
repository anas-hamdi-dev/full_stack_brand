// API Client for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage on initialization
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

  getToken(): string | null {
    return this.token || localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            message: data.error?.message || 'An error occurred',
            code: data.error?.code,
            details: data.error?.details,
          },
        };
      }

      return { data: data.data || data };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  signIn: async (email: string, password: string) => {
    const response = await apiClient.post<{ user: unknown; token: string }>('/auth/signin', {
      email,
      password,
    });
    if (response.data) {
      apiClient.setToken(response.data.token);
    }
    return response;
  },

  signUp: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'client' | 'brand_owner';
    brandData?: {
      name?: string;
      category_id?: string;
      description?: string;
      location?: string;
      website?: string;
      instagram?: string;
      facebook?: string;
    };
  }) => {
    const response = await apiClient.post<{ user: unknown; token: string }>('/auth/signup', data);
    if (response.data) {
      apiClient.setToken(response.data.token);
    }
    return response;
  },

  signOut: async () => {
    await apiClient.post('/auth/signout');
    apiClient.setToken(null);
  },

  getCurrentUser: async () => {
    return apiClient.get<{ user: unknown }>('/auth/me');
  },
};

// Categories API
export const categoriesApi = {
  getAll: () => apiClient.get<unknown[]>('/categories'),
  getById: (id: string) => apiClient.get<unknown>(`/categories/${id}`),
};

// Brands API
export const brandsApi = {
  getAll: (params?: { category_id?: string; featured?: boolean; search?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: unknown[]; pagination?: unknown }>('/brands', params),
  getFeatured: () => apiClient.get<unknown[]>('/brands/featured'),
  getById: (id: string) => apiClient.get<unknown>(`/brands/${id}`),
  getProducts: (brandId: string) => apiClient.get<unknown[]>(`/brands/${brandId}/products`),
  update: (id: string, data: unknown) => apiClient.patch<unknown>(`/brands/${id}`, data),
};

// Products API
export const productsApi = {
  getAll: (params?: { brand_id?: string; category_id?: string; search?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: unknown[]; pagination?: unknown }>('/products', params),
  getById: (id: string) => apiClient.get<unknown>(`/products/${id}`),
  create: (data: unknown) => apiClient.post<unknown>('/products', data),
  update: (id: string, data: unknown) => apiClient.patch<unknown>(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
};

// Favorites API
export const favoritesApi = {
  getAll: () => apiClient.get<unknown[]>('/favorites'),
  add: (productId: string) => apiClient.post<unknown>('/favorites', { product_id: productId }),
  remove: (productId: string) => apiClient.delete(`/favorites/${productId}`),
  check: (productId: string) => apiClient.get<{ isFavorite: boolean }>(`/favorites/check/${productId}`),
};

// Brand Submissions API
export const brandSubmissionsApi = {
  create: (data: unknown) => apiClient.post<unknown>('/brand-submissions', data),
};

// Contact Messages API
export const contactMessagesApi = {
  create: (data: unknown) => apiClient.post<unknown>('/contact-messages', data),
};

// Users API
export const usersApi = {
  getById: (id: string) => apiClient.get<unknown>(`/users/${id}`),
  update: (id: string, data: unknown) => apiClient.patch<unknown>(`/users/${id}`, data),
};
