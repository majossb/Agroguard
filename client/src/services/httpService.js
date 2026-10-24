// src/services/httpService.js
import axios from 'axios';
import { getToken, logout } from '../context/authHelper';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/problem+json, application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.title) {
      if (error.response.status === 401) {
        logout();
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      status: error.response?.status || 0,
      title: 'Network Error',
      detail: error.message,
    });
  }
);

export default api;
