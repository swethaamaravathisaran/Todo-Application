import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(false);
  const API_BASE = 'https://todo-application-15.onrender.com';
  const navigate = useNavigate();

  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleComplete = async (task) => {
    try {
      await fetch(`${API_BASE}/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...task,
          status: task.status === 'Open' ? 'Complete' : 'Open',
        }),
      });
      fetchTasks();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleLogin = async () => {
    const email = prompt('Enter your email');
    const password = prompt('Enter your password');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        fetchTasks();
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setTasks([]);
    navigate('/');
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  return (
    <div className="dashboard-background">
      <div className="dashboard-container">
        <h2 className="dashboard-title">🗂️ Your To-Do Dashboard</h2>

        {!token ? (
          <button className="btn login-btn" onClick={handleLogin}>🔐 Login</button>
        ) : (
          <>
            <div className="dashboard-header">
              <Link to="/add-task" className="btn btn-add-task">➕ Add Task</Link>
              <button className="btn btn-logout" onClick={handleLogout}>🚪 Logout</button>
            </div>

            {loading ? (
              <p className="loading-text">Loading your tasks...</p>
            ) : (
              <ul className="task-list">
                {tasks.length === 0 ? (
                  <li className="loading-text">🎉 No tasks available. Time to relax!</li>
                ) : (
                  tasks.map((task) => (
                    <li key={task._id} className={`task-card ${task.status === 'Complete' ? 'completed' : ''}`}>
                      <div className="task-info">
                        <h3>{task.title}</h3>
                        <p>Status: <em>{task.status}</em></p>
                        {task.dueDate && <p>📅 Due: {task.dueDate.slice(0, 10)}</p>}
                        {task.description && <p>📝 {task.description}</p>}
                      </div>
                      <div className="task-actions">
                        <button className="btn btn-toggle" onClick={() => toggleComplete(task)}>
                          {task.status === 'Open' ? '✔️ Mark Complete' : '🔄 Reopen'}
                        </button>
                        <Link to={`/edit-task/${task._id}`} className="btn">✏️ Edit</Link>
                        <button className="btn btn-delete" onClick={() => deleteTask(task._id)}>❌ Delete</button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
