import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post('https://todo-application-15.onrender.com/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed');
    }
  };

  const handleRegister = async () => {
    try {
      const res = await axios.post('https://todo-application-15.onrender.com/auth/register', { email, password });
      alert('Registration successful! You can now log in.');
      setIsRegistering(false);
    } catch (err) {
      alert('Registration failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      const res = await axios.post('https://todo-application-15.onrender.com/auth/google', { idToken });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      alert('Google login failed');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
        <p className="subtitle">{isRegistering ? 'Register to get started' : 'Please login to your account'}</p>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input"
          type="email"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          className="input"
        />

        {isRegistering ? (
          <button onClick={handleRegister} className="button">Register</button>
        ) : (
          <button onClick={handleLogin} className="button">Login</button>
        )}

        <div className="divider">or</div>

        {!isRegistering && (
          <div className="google-login-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => alert('Google login error')}
              theme="filled_blue"
              size="large"
              width="280"
            />
          </div>
        )}

        <div className="toggle-section">
          {isRegistering ? (
            <p>
              Already have an account?{' '}
              <span onClick={() => setIsRegistering(false)} className="link-text">Login here</span>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <span onClick={() => setIsRegistering(true)} className="link-text">Register here</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
