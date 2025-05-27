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
      </div>

      <div className="home-container">
        <div className="home-content" tabIndex={0} aria-label="Welcome section">
          <h1 className="home-title">
            Welcome to <span className="highlight">TaskMate</span>
          </h1>
          <p className="home-subtitle">
            Simplify your daily goals. Organize, prioritize, and track your tasks with ease.
          </p>
          <button onClick={handleGetStarted} className="home-button" aria-label="Get started with TaskMate">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
