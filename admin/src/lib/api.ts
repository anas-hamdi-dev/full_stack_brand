// API Base URL for admin panel
// VITE_API_BASE_URL should include the /api prefix (e.g., "http://localhost:5000/api" or "https://api.example.com/api")
// For local development, use: "http://localhost:5000/api"
// For production, set this in your .env file or Vercel environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  // Ensure endpoint starts with / if API_BASE_URL doesn't end with /
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${endpointPath}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Check if this is an auth endpoint (signin/signup) - these can return 401 for invalid credentials
  const isAuthEndpoint = endpoint.includes('/auth/signin') || endpoint.includes('/auth/signup');

  let response: Response;
  try {
    response = await fetch(url, {
    ...options,
    headers,
  });
  } catch (error) {
    // Network error
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error. Please check your connection.',
      0
    );
  }

  // Try to parse JSON, but handle non-JSON responses gracefully
  let data: unknown;
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (isJson) {
    try {
      data = await response.json();
    } catch (parseError) {
      // Response is JSON but parsing failed
      throw new ApiError(
        `Failed to parse response: ${response.statusText}`,
        response.status
      );
    }
  } else {
    // Not JSON, try to get text
    const text = await response.text();
    data = text ? { error: text } : {};
  }

  if (!response.ok) {
    // Extract error message from various possible formats
    let errorMessage = 'An error occurred';
    const errorData = data as { error?: string | { message?: string; code?: string }; message?: string };
    
    if (typeof errorData.error === 'string') {
      errorMessage = errorData.error;
    } else if (errorData.error && typeof errorData.error === 'object' && errorData.error.message) {
      errorMessage = errorData.error.message;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    // For auth endpoints, return the actual error message (don't redirect)
    if (isAuthEndpoint) {
      const errorCode = typeof errorData.error === 'object' ? errorData.error.code : undefined;
      throw new ApiError(errorMessage, response.status, errorCode);
    }

    // For other endpoints, handle 401 as authentication required
  if (response.status === 401) {
    removeAuthToken();
    window.location.href = '/admin/login';
    throw new ApiError('Authentication required', 401);
  }

    // For other errors, return the error message
    const errorCode = typeof errorData.error === 'object' ? errorData.error.code : undefined;
    throw new ApiError(errorMessage, response.status, errorCode);
  }

  return data as T;
}

// Auth API
export const authApi = {
  signIn: async (email: string, password: string) => {
    const response = await apiFetch<{ user: any; token: string }>('/admin/auth/signin', {
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
    const response = await apiFetch<{ data: { brands: number; products: number; messages: number } }>('/admin/dashboard/stats');
    return response.data;
  },

  getRecentBrands: async (limit = 5) => {
    const response = await apiFetch<{ data: any[] }>(`/admin/dashboard/recent-brands?limit=${limit}`);
    return response.data;
  },
};

// Admin Brands API
export const adminBrandsApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
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
  getAll: async (params?: { search?: string; brand_id?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.brand_id) queryParams.append('brand_id', params.brand_id);
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


export { ApiError };
