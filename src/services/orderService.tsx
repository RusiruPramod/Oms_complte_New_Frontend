// src/services/orderService.ts
import request from './api';

export const getOrders = async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
  const qs = new URLSearchParams();
  if (params) {
    if (params.page) qs.append('page', String(params.page));
    if (params.limit) qs.append('limit', String(params.limit));
    if (params.status) qs.append('status', params.status);
    if (params.search) qs.append('search', params.search);
  }
  const endpoint = `orders${qs.toString() ? `?${qs.toString()}` : ''}`;
  return request(endpoint, { method: 'GET' });
};

export const getOrderById = async (id: string, token: string) => {
  return request(`orders/${id}`, { method: 'GET', token });
};

export const createOrder = async (data: any) => {
  return request('orders', { method: 'POST', body: data });
};

export const updateOrderStatus = async (id: string, status: string, token?: string) => {
  return request(`orders/${id}/status`, { method: 'PUT', body: { status }, token });
};

export const deleteOrder = async (id: string, token?: string) => {
  return request(`orders/${id}`, { method: 'DELETE', token });
};
