// src/Login.tsx
import React, { useState } from 'react';
import axiosNoAuthInstance from '../utils/no_auth';
import { useNavigate } from 'react-router-dom';

// Define types for the form data
interface LoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  // State for form inputs and message
  const [formData, setFormData] = useState<LoginFormData>({ username: '', password: '' });
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axiosNoAuthInstance.post('/login', formData);
      // On successful login, redirect to home/dashboard
      navigate('/blogs');  // Change this route to your desired post-login page
    } catch (error: any) {
      setMessage("[" + error.response.data.status_code + "]: " + error.response.data.error_msg);
    }
  };

  return (
    <div className="App">
      <h2>Login</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit} className="post-form">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <a href="/sign-up">Sign Up</a>
      </p>
    </div>
  );
};

export default Login;
