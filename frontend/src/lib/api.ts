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

      // Check if response has content and is JSON
      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          // If JSON parsing fails, return a generic error
          return {
            error: {
              message: `Invalid response from server (Status: ${response.status})`,
              code: 'INVALID_JSON',
            },
          };
        }
      } else {
        // Non-JSON response
        const text = await response.text();
        return {
          error: {
            message: text || `Server error (Status: ${response.status})`,
            code: `HTTP_${response.status}`,
          },
        };
      }

      if (!response.ok) {
        return {
          error: {
            message: data.error?.message || data.error || data.message || `Server error (Status: ${response.status})`,
            code: data.error?.code || `HTTP_${response.status}`,
            details: data.error?.details || data.details,
          },
        };
      }

      // Handle both { data: {...} } and direct response formats
      return { data: data.data || data };
    } catch (error) {
      // Handle network errors, CORS errors, etc.
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          error: {
            message: 'Network error: Unable to connect to server. Please check your internet connection.',
            code: 'NETWORK_ERROR',
          },
        };
      }
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
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
    full_name: string;
    phone?: string;
    role: 'client' | 'brand_owner';
    brandData?: {
      name?: string;
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

  verifyEmail: async (email: string, verificationCode: string) => {
    return apiClient.post<{ success: boolean; message: string; user: unknown }>('/auth/verify-email', {
      email,
      verificationCode,
    });
  },

  resendVerificationCode: async (email: string) => {
    return apiClient.post<{ success: boolean; message: string }>('/auth/resend-verification', {
      email,
    });
  },
};


// Brands API
export const brandsApi = {
  getAll: (params?: { featured?: boolean; search?: string; limit?: number }) =>
    apiClient.get<{ data: unknown[] }>('/brands', params),
  getFeatured: () => apiClient.get<{ data: unknown[] }>('/brands/featured'),
  getById: (id: string) => apiClient.get<{ data: unknown }>(`/brands/${id}`),
  getMyBrand: () => apiClient.get<{ data: unknown }>('/brands/me'),
  getProducts: (brandId: string) => apiClient.get<{ data: unknown[] }>(`/brands/${brandId}/products`),
  getMyProducts: () => apiClient.get<{ data: unknown[] }>('/brands/me/products'),
  create: (data: unknown) => apiClient.post<{ data: unknown }>('/brands', data),
  update: (id: string, data: unknown) => apiClient.patch<{ data: unknown }>(`/brands/${id}`, data),
};

// Products API
export const productsApi = {
  getAll: (params?: { brand_id?: string; search?: string; limit?: number }) =>
    apiClient.get<{ data: unknown[] }>('/products', params),
  getById: (id: string) => apiClient.get<{ data: unknown }>(`/products/${id}`),
  create: (data: { name: string; description?: string; price?: number; images: string[] }) => 
    apiClient.post<{ data: unknown }>('/products', data),
  update: (id: string, data: { name?: string; description?: string; price?: number; images?: string[] }) => 
    apiClient.patch<{ data: unknown }>(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
};

// Favorites API
export const favoritesApi = {
  getAll: () => apiClient.get<unknown[]>('/favorites'),
  add: (productId: string) => apiClient.post<unknown>('/favorites', { product_id: productId }),
  remove: (productId: string) => apiClient.delete(`/favorites/${productId}`),
  check: (productId: string) => apiClient.get<{ isFavorite: boolean }>(`/favorites/check/${productId}`),
};


// Contact Messages API
export const contactMessagesApi = {
  create: (data: unknown) => apiClient.post<unknown>('/contact-messages', data),
};

// Users API
export const usersApi = {
  update: (data: { full_name?: string; phone?: string }) => 
    apiClient.patch<{ user: unknown }>('/users/me', data),
};

// Admin API (Note: Status-based endpoints removed. Brand owners are managed through brand data.)
export const adminApi = {
  getBrandOwners: () => apiClient.get<{ data: unknown[] }>('/admin/brand-owners'),
};
