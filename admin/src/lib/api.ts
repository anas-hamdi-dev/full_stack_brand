const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem('admin_auth');
    if (stored) {
      const auth = JSON.parse(stored);
      return auth.token || null;
    }
  } catch (error) {
    console.error('Error reading auth token:', error);
  }
  return null;
}

// Set auth token in localStorage
function setAuthToken(token: string): void {
  try {
    const stored = localStorage.getItem('admin_auth');
    const auth = stored ? JSON.parse(stored) : {};
    auth.token = token;
    localStorage.setItem('admin_auth', JSON.stringify(auth));
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
}

// Remove auth token from localStorage
function removeAuthToken(): void {
  try {
    const stored = localStorage.getItem('admin_auth');
    if (stored) {
      const auth = JSON.parse(stored);
      delete auth.token;
      localStorage.setItem('admin_auth', JSON.stringify(auth));
    }
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
}

// Base fetch function with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    removeAuthToken();
    window.location.href = '/admin/login';
    throw new ApiError('Authentication required', 401);
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(errorMessage, response.status, data.error?.code);
  }

  return data;
}

// Auth API
export const authApi = {
  signIn: async (email: string, password: string) => {
    const response = await apiFetch<{ user: any; token: string }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(response.token);
    return response;
  },

  signOut: async () => {
    try {
      await apiFetch('/auth/signout', { method: 'POST' });
    } catch (error) {
      // Continue even if signout fails
      console.error('Signout error:', error);
    } finally {
      removeAuthToken();
    }
  },

  getMe: async () => {
    return apiFetch<{ user: any }>('/auth/me');
  },
};

// Admin Dashboard API
export const adminDashboardApi = {
  getStats: async () => {
    const response = await apiFetch<{ data: { brands: number; products: number; categories: number; messages: number } }>('/admin/dashboard/stats');
    return response.data;
  },

  getRecentBrands: async (limit = 5) => {
    const response = await apiFetch<{ data: any[] }>(`/admin/dashboard/recent-brands?limit=${limit}`);
    return response.data;
  },
};

// Admin Brands API
export const adminBrandsApi = {
  getAll: async (params?: { search?: string; category_id?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category_id) queryParams.append('category_id', params.category_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    const endpoint = `/admin/brands${queryString ? `?${queryString}` : ''}`;
    const response = await apiFetch<{ data: any[]; pagination?: any }>(endpoint);
    return response;
  },

  getById: async (id: string) => {
    const response = await apiFetch<{ data: any }>(`/admin/brands/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiFetch<{ data: any }>('/admin/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiFetch<{ data: any }>(`/admin/brands/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  delete: async (id: string) => {
    await apiFetch<{ success: boolean; message: string }>(`/admin/brands/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin Products API
export const adminProductsApi = {
  getAll: async (params?: { search?: string; brand_id?: string; category_id?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.brand_id) queryParams.append('brand_id', params.brand_id);
    if (params?.category_id) queryParams.append('category_id', params.category_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    const endpoint = `/admin/products${queryString ? `?${queryString}` : ''}`;
    const response = await apiFetch<{ data: any[]; pagination?: any }>(endpoint);
    return response;
  },

  getById: async (id: string) => {
    const response = await apiFetch<{ data: any }>(`/admin/products/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiFetch<{ data: any }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiFetch<{ data: any }>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  delete: async (id: string) => {
    await apiFetch<{ success: boolean; message: string }>(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin Categories API
export const adminCategoriesApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/admin/categories${queryString ? `?${queryString}` : ''}`;
    const response = await apiFetch<{ data: any[]; pagination?: any }>(endpoint);
    return response;
  },

  getById: async (id: string) => {
    const response = await apiFetch<{ data: any }>(`/admin/categories/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiFetch<{ data: any }>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiFetch<{ data: any }>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  delete: async (id: string) => {
    await apiFetch<{ success: boolean; message: string }>(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin Messages API
export const adminMessagesApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/admin/messages${queryString ? `?${queryString}` : ''}`;
    const response = await apiFetch<{ data: any[]; pagination?: any }>(endpoint);
    return response;
  },

  getById: async (id: string) => {
    const response = await apiFetch<{ data: any }>(`/admin/messages/${id}`);
    return response.data;
  },

  delete: async (id: string) => {
    await apiFetch<{ success: boolean; message: string }>(`/admin/messages/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin Brand Submissions API
export const adminBrandSubmissionsApi = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/admin/brand-submissions${queryString ? `?${queryString}` : ''}`;
    const response = await apiFetch<{ data: any[]; pagination?: any }>(endpoint);
    return response;
  },

  getById: async (id: string) => {
    const response = await apiFetch<{ data: any }>(`/admin/brand-submissions/${id}`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await apiFetch<{ data: any; brand?: any; message: string }>(`/admin/brand-submissions/${id}/approve`, {
      method: 'PATCH',
    });
    return response;
  },

  reject: async (id: string) => {
    const response = await apiFetch<{ data: any; message: string }>(`/admin/brand-submissions/${id}/reject`, {
      method: 'PATCH',
    });
    return response;
  },

  delete: async (id: string) => {
    await apiFetch<{ success: boolean; message: string }>(`/admin/brand-submissions/${id}`, {
      method: 'DELETE',
    });
  },
};

// Public Categories API (for dropdowns, etc.)
export const categoriesApi = {
  getAll: async () => {
    const response = await apiFetch<{ data: any[] }>('/categories');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiFetch<{ data: any }>(`/categories/${id}`);
    return response.data;
  },
};

export { ApiError };
