import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="home-wrapper">
      <div className="navbar">
        <div className="logo">TaskMate</div>
        {/* <button className="login-button" onClick={handleGetStarted}>Login</button> */}
      </div>

      <div className="home-container">
        <div className="home-content">
          <h1 className="home-title">Welcome to <span className="highlight">TaskMate</span></h1>
          <p className="home-subtitle">
            Simplify your daily goals. Organize, prioritize, and track your tasks with ease.
          </p>
          <button onClick={handleGetStarted} className="home-button">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
