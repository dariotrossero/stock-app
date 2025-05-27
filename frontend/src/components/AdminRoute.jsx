import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  // Obtener el usuario del localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Verificar si el usuario es admin
  if (!user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute; 