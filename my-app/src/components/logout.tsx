// Logout.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosNoAuthInstance from '../utils/no_auth';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logoutUser = async () => {
      try {
        await axiosNoAuthInstance.post('/logout');
        // On successful logout, navigate to the login page
        navigate('/login');
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };

    logoutUser();
  }, [navigate]);

  return <p>LogOut...</p>;
};

export default Logout;
