// src/utils/no_auth.js
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create axios instance
const axiosAuthInstance = axios.create({
  baseURL: 'http://localhost:8080/api/v1',  // Adjust baseURL to your API's URL
  withCredentials: true, // Ensure cookies are sent along with requests
});

// Add a response interceptor to handle the 401 status code
axiosAuthInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.status === 401) {
      console.log('401 detected: Redirecting to login...' + error);
      // Redirect to login on 401 error (Unauthorized or method not allowed)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosAuthInstance;
