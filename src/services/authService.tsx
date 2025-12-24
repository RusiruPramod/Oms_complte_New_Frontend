// src/services/authService.ts
import request from './api';

export const registerUser = async (data: { name: string; email: string; password: string }) => {
  return request('auth/register', { method: 'POST', body: data });
};

export const loginUser = async (data: { email: string; password: string }) => {
  return request('auth/login', { method: 'POST', body: data });
};

export const getProfile = async (token: string) => {
  return request('auth/profile', { method: 'GET', token });
};

