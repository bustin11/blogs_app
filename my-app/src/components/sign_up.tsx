// src/SignUp.tsx
import React, { useState } from 'react';
import axiosNoAuthInstance from '../utils/no_auth';
import { useNavigate } from 'react-router-dom';

// Define types for the form data
interface SignUpFormData {
  username: string;
  password: string;
}

const SignUp: React.FC = () => {
  // State for form inputs and message
  const [formData, setFormData] = useState<SignUpFormData>({ username: '', password: '' });
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axiosNoAuthInstance.post('/sign_up', formData);
      setMessage('Sign-up successful! Please login.');
      setFormData({ username: '', password: '' });  // Reset form after successful sign-up
    } catch (error: any) {
      setMessage("[" + error.response.data.status_code + "]: " + error.response.data.error_msg);
    }
  };

  return (
    <div className="App">
      <h2>Sign Up</h2>
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
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
};

export default SignUp;
