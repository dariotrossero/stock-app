import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (username, password) => {
    try {
      console.log('Intentando login...');
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/token', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Respuesta del login:', data);

      if (!response.ok) {
        throw { response: { data } };
      }

      setToken(data.access_token);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Cerrando sesión...');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    const isAuth = !!token;
    console.log('Verificando autenticación:', isAuth);
    return isAuth;
  };

  const isAdmin = () => {
    const admin = user?.is_admin === true;
    console.log('Verificando si es admin:', admin);
    return admin;
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 