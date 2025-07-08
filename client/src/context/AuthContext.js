import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // This effect runs when the token changes, handling user loading.
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        localStorage.setItem('token', token);
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
        } catch (err) {
          // Token is invalid, clear it.
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        // No token, ensure user is null.
        setUser(null);
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // This effect handles navigation after the user state is confirmed.
  useEffect(() => {
    if (!loading && user) {
      navigate('/todos', { replace: true });
    }
  }, [user, loading, navigate]);

  // Login user: get token, save it, fetch user, then update state
  const login = async (formData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      setToken(res.data.token); // This triggers the user loading effect.
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  // Register user: get token, save it, fetch user, then update state
  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      setToken(res.data.token); // This triggers the user loading effect.
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    setToken(null); // This triggers the effect to clear the user.
    navigate('/login');
  };

  const clearErrors = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        clearErrors,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
