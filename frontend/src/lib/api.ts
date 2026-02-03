// API Client for backend communication
// VITE_API_URL should include the /api prefix (e.g., "http://localhost:5000/api" or "https://api.example.com/api")
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

    // Don't set Content-Type for FormData - browser will set it with boundary
    const isFormData = options.body instanceof FormData;
    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
      let data: Record<string, unknown> = {};
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = (await response.json()) as Record<string, unknown>;
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
        const errorData = (data.error as Record<string, unknown>) || {};
        const message = typeof errorData.message === 'string' 
          ? errorData.message 
          : typeof data.error === 'string' 
            ? data.error 
            : typeof data.message === 'string' 
              ? data.message 
              : `Server error (Status: ${response.status})`;
        return {
          error: {
            message,
            code: typeof errorData.code === 'string' ? errorData.code : `HTTP_${response.status}`,
            details: errorData.details || data.details,
          },
        };
      }

      // Handle both { data: {...} } and direct response formats
      // Backend responses typically wrap data in { data: ... } but some endpoints return direct objects
      // For paginated responses, preserve the full structure including pagination
      if (data.pagination && data.data) {
        // This is a paginated response, return the full object
        return { data: data as T };
      }
      return { data: (data.data || data) as T };
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

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown | FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  }

  async patch<T>(endpoint: string, body?: unknown | FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
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
  getAll: (params?: { featured?: boolean; search?: string; limit?: number; page?: number }) => {
    // Convert featured boolean to string 'true'/'false' to match backend query parameter format
    const queryParams = params ? {
      ...params,
      featured: params.featured !== undefined ? String(params.featured) : undefined,
    } : undefined;
    // Return the full response to preserve pagination metadata
    return apiClient.get<{ data: unknown[]; pagination?: { page: number; limit: number; total: number; hasMore: boolean } }>('/brands', queryParams);
  },
  getFeatured: () => apiClient.get<{ data: unknown[] }>('/brands/featured'),
  getById: (id: string) => apiClient.get<{ data: unknown }>(`/brands/${id}`),
  getMyBrand: () => apiClient.get<{ data: unknown }>('/brands/me'),
  getProducts: (brandId: string) => apiClient.get<{ data: unknown[] }>(`/brands/${brandId}/products`),
  getMyProducts: (params?: { limit?: number; page?: number }) => {
    // Return the full response to preserve pagination metadata
    return apiClient.get<{ data: unknown[]; pagination?: { page: number; limit: number; total: number; hasMore: boolean } }>('/brands/me/products', params);
  },
  create: (data: FormData) => apiClient.post<{ data: unknown }>('/brands', data),
  update: (id: string, data: FormData) => apiClient.patch<{ data: unknown }>(`/brands/${id}`, data),
};

// Products API
export const productsApi = {
  getAll: (params?: { brand_id?: string; search?: string; limit?: number; page?: number }) => {
    // Return the full response to preserve pagination metadata
    return apiClient.get<{ data: unknown[]; pagination?: { page: number; limit: number; total: number; hasMore: boolean } }>('/products', params);
  },
  getById: (id: string) => apiClient.get<{ data: unknown }>(`/products/${id}`),
  create: (data: FormData) => 
    apiClient.post<{ data: unknown }>('/products', data),
  update: (id: string, data: FormData) => 
    apiClient.patch<{ data: unknown }>(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
};

// Favorites API
export const favoritesApi = {
  getAll: () => apiClient.get<{ data: unknown[] }>('/favorites'),
  add: (productId: string) => apiClient.post<{ data: unknown }>('/favorites', { product_id: productId }),
  remove: (productId: string) => apiClient.delete(`/favorites/${productId}`),
  check: (productId: string) => apiClient.get<{ isFavorite: boolean }>(`/favorites/check/${productId}`),
};


// Contact Messages API
export const contactMessagesApi = {
  create: (data: { name: string; email: string; subject: string; message: string }) => 
    apiClient.post<{ data: unknown }>('/contact-messages', data),
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
