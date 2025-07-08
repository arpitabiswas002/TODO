import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { login, error, clearErrors } = useAuth();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) clearErrors();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h1>Sign in to your account</h1>
        {error && <div className="error-alert">{error}</div>}
        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
            />
          </div>
          <button type="submit" className="auth-submit-btn">
            Sign In
          </button>
        </form>
        <p className="auth-switch-link">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
