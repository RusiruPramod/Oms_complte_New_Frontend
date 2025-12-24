// src/services/courierService.ts
import request from './api';

export const getCourierOrders = async (
  params?: { page?: number; limit?: number; status?: string; search?: string },
  token?: string
) => {
  const qs = new URLSearchParams();
  if (params) {
    if (params.page) qs.append('page', String(params.page));
    if (params.limit) qs.append('limit', String(params.limit));
    if (params.status) qs.append('status', params.status);
    if (params.search) qs.append('search', params.search);
  }
  const endpoint = `courier/orders${qs.toString() ? `?${qs.toString()}` : ''}`;
  return request(endpoint, { method: 'GET', token });
};

export const updateCourierStatus = async (id: string, status: string, token: string) => {
  return request(`courier/${id}/status`, { method: 'PUT', body: { status }, token });
};
