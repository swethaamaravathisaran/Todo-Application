import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './Components/Login';
import Dashboard from './Components/Dashboard';
import AddTaskForm from './Components/AddTaskForm';
import EditTask from './Components/EditTask';
import Home from './Components/Home';


function OAuthHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/dashboard');
    }
  }, [location, navigate]);

  return <p>Logging you in...</p>;
}

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/login" element={<Login />} />
      <Route path="/oauth-success" element={<OAuthHandler />} />
      <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-task" element={<AddTaskForm />} />
      <Route path="/edit-task/:id" element={<EditTask />} />
    </Routes>
  </BrowserRouter>
);

export default App;
