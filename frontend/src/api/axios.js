import axios from 'axios';

// create a reusable axios instance for api requests
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// automatically attach jwt token to every request if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  // if token exists, add it to Authorization header
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // return modified config
  return config;
});

export default API;
