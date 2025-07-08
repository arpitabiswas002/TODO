import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { todosAPI, activityAPI } from '../services/api';
import io from 'socket.io-client';
import '../pages/TodoList.css';

const socket = io('http://localhost:5000');

const normalizeStatus = (status) => {
  if (!status) return 'todo';
  const lowerCaseStatus = status.toLowerCase();
  if (lowerCaseStatus.includes('in_progress') || lowerCaseStatus.includes('in progress')) {
    return 'in_progress';
  }
  if (lowerCaseStatus === 'done' || lowerCaseStatus === 'completed') {
    return 'done';
  }
  return 'todo';
};

const KanbanBoard = () => {
  const { user, logout } = useAuth();
  const [todos, setTodos] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);

  const fetchTodos = async () => {
    try {
            const response = await todosAPI.getTodos();
      setTodos(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch todos. Please try again later.');
      console.error(err);
    }
  };

  const fetchActivities = async () => {
    try {
            const response = await activityAPI.getActivities();
      setActivities(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  useEffect(() => {
    fetchTodos();
    fetchActivities();

    const handleActivity = (newActivity) => {
      setActivities(prev => [newActivity, ...prev]);
      fetchTodos();
    };
    
    socket.on('activity', handleActivity);

    const handleTaskUpdate = () => {
      fetchTodos();
    };

    socket.on('task_updated', handleTaskUpdate);

    return () => {
      socket.off('activity', handleActivity);
      socket.off('task_updated', handleTaskUpdate);
    };
  }, [user]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) {
      setError('Title is required.');
      return;
    }
    try {
            await todosAPI.createTodo(newTask);
      setNewTask({ title: '', description: '' });
      setShowAddTask(false);
      setError('');
      fetchTodos(); // Manually refresh the task list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add task.');
      console.error(err);
    }
  };

  const handleAdvanceStatus = async (todoId) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const currentStatus = normalizeStatus(todo.status);
    const nextStatus = currentStatus === 'todo' ? 'in_progress' : 'done';

    if (currentStatus === 'done') return;

    try {
            await todosAPI.updateTodo(todoId, { status: nextStatus });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task status.');
      console.error(err);
    }
  };

  const handleDeleteTask = async (todoId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
                await todosAPI.deleteTodo(todoId);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete task.');
        console.error(err);
      }
    }
  };

  const handleSmartAssign = async (todoId) => {
    try {
      await todosAPI.smartAssign(todoId);
      fetchTodos(); // Refresh board to show new assignee
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to smart assign task.');
      console.error(err);
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedItem(task);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (draggedItem && normalizeStatus(draggedItem.status) !== targetStatus) {
      try {
                await todosAPI.updateTodo(draggedItem.id, { status: targetStatus });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to update task status.');
        console.error(err);
      }
    }
  };
  
  const columns = [
    { title: 'Todo', key: 'todo' },
    { title: 'In Progress', key: 'in_progress' },
    { title: 'Done', key: 'done' },
  ];

  const renderTaskCard = (task) => (
    <div
      key={task.id}
      className="task-card"
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      onDragEnd={handleDragEnd}
    >
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <div className="task-footer">
        <div className="task-actions">
          {normalizeStatus(task.status) === 'todo' && (
            <button onClick={() => handleAdvanceStatus(task.id)} className="task-action-btn">
              Start
            </button>
          )}
          {normalizeStatus(task.status) === 'in_progress' && (
            <button onClick={() => handleAdvanceStatus(task.id)} className="task-action-btn">
              Complete
            </button>
          )}
          {normalizeStatus(task.status) !== 'done' && (
            <button onClick={() => handleSmartAssign(task.id)} className="smart-assign-btn">
              Smart Assign
            </button>
          )}
          <button onClick={() => handleDeleteTask(task.id)} className="task-action-btn delete-btn">
            Delete
          </button>
        </div>
        <span className="task-assignee">
          {task.assignee ? `Assigned to: ${task.assignee.name}` : 'Unassigned'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="kanban-board-container">
      <div className="kanban-header">
        <h1>Kanban Board</h1>
        <div className="header-user-info">
          <span>Welcome, {user.name}</span>
          <button onClick={() => setShowAddTask(!showAddTask)} className="add-task-btn">
            {showAddTask ? 'Cancel' : '+ Add Task'}
          </button>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      {showAddTask && (
        <div className="add-task-form">
          <h3>Add New Task</h3>
          <form onSubmit={handleAddTask}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Task description (optional)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              ></textarea>
            </div>
            <button type="submit" className="submit-task-btn">Submit Task</button>
          </form>
        </div>
      )}

      <div className="kanban-board-layout">
        <div className="kanban-board">
          {columns.map(col => (
            <div
              key={col.key}
              className={`kanban-column ${col.key}-col`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <h2>{col.title}</h2>
              <div className="tasks-container">
                {todos.filter(t => normalizeStatus(t.status) === col.key).map(renderTaskCard)}
              </div>
            </div>
          ))}
        </div>
        <div className="activity-log-panel">
          <h2>Activity Log</h2>
          <ul className="activity-list">
            {activities.map(act => (
              <li key={act.id} className="activity-item">
                <div className="activity-details">{act.details}</div>
                <div className="activity-time">
                  {new Date(act.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
