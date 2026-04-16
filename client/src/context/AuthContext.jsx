import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken } from '../services/api';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    // Check if Discord callback returned a token in the URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setToken(token);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('council_token');
    if (!token) {
      // No token, check if backend is online
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API_URL}/api/health`, { signal: controller.signal });
        clearTimeout(timer);
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setBackendOnline(true);
    } catch {
      // Token invalido, limpiar
      setToken(null);
      setUser(null);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }

  function login() {
    if (!backendOnline) {
      // Modo demo
      setUser({
        id: 1, discord_id: '0', discord_name: 'Demo User',
        avatar_url: null, role: 'admin', council_rank: 'plebeius',
        override_rank: null, reputation: 0, objectivity_score: 50, recommender_points: 0,
      });
      return;
    }
    window.location.href = `${API_URL}/api/auth/discord`;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, backendOnline }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
