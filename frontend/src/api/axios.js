import axios from 'axios';

// create a reusable axios instance for api requests
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true // required to send/receive cookies with every request
});

// Http-Only cookie will be automatically attached to the request headers
API.interceptors.request.use((config) => {
  return config;
});

export default API;
