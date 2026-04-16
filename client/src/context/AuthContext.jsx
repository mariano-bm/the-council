import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEMO_USER = {
  id: 1,
  discord_id: '000000000000000000',
  discord_name: 'El Viejo',
  avatar_url: null,
  role: 'admin',
  council_rank: 'plebeius',
  override_rank: null,
  reputation: 0,
  objectivity_score: 75.00,
  recommender_points: 42,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          setUser(data.user || null);
        }
        setBackendOnline(true);
      } else {
        // Backend respondió pero no estamos autenticados
        setBackendOnline(res.status !== 502 && res.status !== 504);
        setUser(null);
      }
    } catch (err) {
      // Network error, timeout, o proxy error
      setUser(null);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }

  function login() {
    if (!backendOnline) {
      setUser(DEMO_USER);
      return;
    }
    window.location.href = '/api/auth/discord';
  }

  function loginDemo() {
    setUser(DEMO_USER);
  }

  async function logout() {
    if (user?.discord_id === DEMO_USER.discord_id) {
      setUser(null);
      return;
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginDemo, logout, checkAuth, backendOnline }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
