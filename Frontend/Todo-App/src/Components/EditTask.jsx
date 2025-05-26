import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditTask.css';

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [token] = useState(localStorage.getItem('token') || '');
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });
  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`${API_BASE}/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setForm({
          title: data.title || '',
          description: data.description || '',
          dueDate: data.dueDate ? data.dueDate.slice(0, 10) : '',
        });
      } catch (err) {
        console.error('Fetch task error:', err);
      }
    };
    fetchTask();
  }, [id, token]);

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        navigate('/dashboard');
      } else {
        alert('Failed to update task');
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  return (
    <div className="edit-task-wrapper">
      <div className="edit-task-container">
        <h2>✏️ Edit Task</h2>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
        />
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
        <div className="btn-group">
          <button className="btn" onClick={handleSave}>💾 Save</button>
          <button className="btn btn-cancel" onClick={() => navigate('/dashboard')}>❌ Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default EditTask;
