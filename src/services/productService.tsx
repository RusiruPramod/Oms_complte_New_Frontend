// src/services/productService.ts
import request from './api';

export const getProducts = async () => {
  return request('products', { method: 'GET' });
};

export const createProduct = async (data: any, token: string) => {
  return request('products', { method: 'POST', body: data, token });
};

export const updateProduct = async (id: string, data: any, token: string) => {
  return request(`products/${id}`, { method: 'PUT', body: data, token });
};

export const deleteProduct = async (id: string, token: string) => {
  return request(`products/${id}`, { method: 'DELETE', token });
};
