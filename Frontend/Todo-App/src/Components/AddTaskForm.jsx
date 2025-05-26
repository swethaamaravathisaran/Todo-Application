import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddTaskForm.css';

const AddTaskForm = () => {
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });
  const token = localStorage.getItem('token');
  const API_BASE = 'http://localhost:5000';
  const navigate = useNavigate();

  const createTask = async () => {
    if (!form.title) return alert('Title is required');
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        alert('Task added successfully!');
        navigate('/dashboard');
      } else {
        alert('Failed to add task');
      }
    } catch (err) {
      console.error('Create error:', err);
      alert('Error adding task');
    }
  };

  return (
    <div className="add-task-wrapper">
      <div className="add-task-container">
        <h2>Add New Task</h2>
        <div className="form-group">
          <label>Title*</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Enter task title"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Enter description"
          />
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
        <button className="btn btn-submit" onClick={createTask}>
          ➕ Add Task
        </button>
        <button className="btn btn-back" onClick={() => navigate('/dashboard')}>
          ⬅️ Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AddTaskForm;
