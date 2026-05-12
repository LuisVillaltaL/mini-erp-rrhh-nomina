// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function AuthProvider({ children }) {
  const [usuario,  setUsuario]  = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token           = localStorage.getItem('erp_token');
    const usuarioGuardado = localStorage.getItem('erp_usuario');

    if (token && usuarioGuardado) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUsuario(JSON.parse(usuarioGuardado));
        } else {
          localStorage.removeItem('erp_token');
          localStorage.removeItem('erp_usuario');
        }
      } catch {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_usuario');
      }
    }
    setCargando(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const res  = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesion');
    localStorage.setItem('erp_token',   data.token);
    localStorage.setItem('erp_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_usuario');
    setUsuario(null);
  }, []);

  const authFetch = useCallback((url, options = {}) => {
    const t = localStorage.getItem('erp_token');
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: t ? `Bearer ${t}` : '',
      },
    });
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook en export separado — requerido para Vite Fast Refresh
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}