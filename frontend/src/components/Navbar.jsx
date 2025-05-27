import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  LogoutOutlined
} from '@ant-design/icons';

const { Header } = Layout;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Clientes',
    },
    {
      key: '/items',
      icon: <ShoppingCartOutlined />,
      label: 'Productos',
    },
    {
      key: '/sales',
      icon: <ShoppingOutlined />,
      label: 'Ventas',
    },
  ];

  // Agregar la opción de Usuarios solo para administradores
  if (isAdmin()) {
    menuItems.push({
      key: '/users',
      icon: <TeamOutlined />,
      label: 'Usuarios',
    });
  }

  return (
    <Header style={{ 
      position: 'fixed', 
      zIndex: 1, 
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ margin: 0, marginRight: 48 }}>Sistema de Ventas</h1>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span>Bienvenido, {user?.username}</span>
        <Button 
          type="primary" 
          danger 
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          Cerrar Sesión
        </Button>
      </div>
    </Header>
  );
};

export default Navbar; 