// src/services/api.ts
const API_BASE = import.meta.env.VITE_API_URL || 'https://oms.rusiru.yanawahana.lk/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds

interface RequestOptions extends RequestInit {
  body?: any;
  token?: string;
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  };

  const url = `${API_BASE}/${endpoint}`;
  
  // Only log in development
  if (import.meta.env.DEV) {
    console.log(`API Request: ${options.method || 'GET'} ${url}`, options.body);
  }

  try {
    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { message: `API request failed with status ${res.status}` };
      }
      console.error('API Error:', res.status, errorData);
      throw new Error(errorData.message || `API request failed with status ${res.status}`);
    }

    const response = await res.json();
    
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('API Response:', response);
    }
    
    // Extract data from response if it has the standard format
    if (response.success && response.data !== undefined) {
      return response.data;
    }
    
    // Otherwise return the full response
    return response;
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error('API Request Error:', error);
    }
    
    // Handle timeout errors
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }
    
    // Handle network errors
    if (error.message === 'Failed to fetch') {
      throw new Error('Network error - please check your connection');
    }
    
    throw error;
  }
}

export default request;
