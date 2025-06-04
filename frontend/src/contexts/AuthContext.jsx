import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      // Intentar obtener los datos del usuario si no están disponibles
      if (!user) {
        fetchUserData();
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      console.log('Obteniendo datos del usuario...');
      console.log('Token:', token);
      const response = await fetch('http://localhost:8000/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        console.error('Status:', response.status);
        console.error('Status text:', response.statusText);
        throw new Error(`Error al obtener datos del usuario: ${JSON.stringify(errorData)}`);
      }
      
      const userData = await response.json();
      console.log('Datos del usuario obtenidos:', userData);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const login = async (username, password) => {
    try {
      console.log('Intentando login...');
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();
      console.log('Respuesta del login:', data);

      if (!response.ok) {
        throw { response: { data } };
      }

      setToken(data.access_token);
      
      // Obtener datos del usuario después del login
      const userResponse = await fetch('http://localhost:8000/users/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Error al obtener datos del usuario');
      }
      
      const userData = await userResponse.json();
      console.log('Datos del usuario obtenidos:', userData);
      setUser(userData);
      
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