// src/services/analyticsService.tsx
import request from './api';

export const getAnalytics = async (token: string) => {
  return request('analytics', { method: 'GET', token });
};

export const getTopProducts = async (limit: number, token: string) => {
  return request(`analytics/top-products?limit=${limit}`, { method: 'GET', token });
};

export const getRevenueAnalytics = async (period: string, token: string) => {
  return request(`analytics/revenue?period=${period}`, { method: 'GET', token });
};

export const getCustomerAnalytics = async (token: string) => {
  return request('analytics/customers', { method: 'GET', token });
};

export const getProductPerformance = async (token: string, startDate?: string, endDate?: string) => {
  let url = 'analytics/product-performance';
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }
  return request(url, { method: 'GET', token });
};
