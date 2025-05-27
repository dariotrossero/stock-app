import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Badge, Tooltip } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  WarningOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import ItemList from './components/ItemList';
import SaleList from './components/SaleList';
import UserList from './components/UserList';
import AdminRoute from './components/AdminRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import { api } from './services/api';
import { message } from 'antd';

const { Header, Sider, Content } = Layout;

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const AppContent = () => {
  const { isAuthenticated, user, logout, isAdmin, token } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [selectedKey, setSelectedKey] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    logout();
    message.success('Sesión cerrada exitosamente');
  };

  const fetchLowStockItems = async () => {
    if (!token) {
      console.log('No hay token disponible');
      return;
    }

    try {
      console.log('Obteniendo items con stock bajo...');
      const response = await api.get('/items/low-stock');
      console.log('Respuesta del servidor:', response.status);
      const data = response.data;
      if (Array.isArray(data)) {
        // Si es un array (vacío o no), simplemente lo seteamos y no mostramos error
        setLowStockItems(data);
        if (data.length === 0) {
          console.log('No hay productos con stock bajo.');
        } else {
          console.log('Items con stock bajo recibidos:', data);
        }
      } else if (data && data.detail) {
        // Si la respuesta es un error del backend
        console.error('Error en la respuesta:', data.detail);
        setLowStockItems([]);
      } else {
        // Otro caso inesperado
        console.error('Respuesta inesperada:', data);
        setLowStockItems([]);
      }
    } catch (error) {
      console.error('Error al obtener items con stock bajo:', error);
      setLowStockItems([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated() && token) {
      console.log('Usuario autenticado, obteniendo items con stock bajo...');
      fetchLowStockItems();
      // Actualizar cada 5 segundos en lugar de 30
      const interval = setInterval(fetchLowStockItems, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

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

  if (isAdmin()) {
    menuItems.push({
      key: '/users',
      icon: <TeamOutlined />,
      label: 'Usuarios',
    });
  }

  if (isLoginPage) {
    return <Login />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? '16px' : '20px',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'SV' : 'Sistema de Ventas'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => {
            setSelectedKey(key);
            navigate(key);
          }}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: 0, 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '16px'
        }}>
          <Tooltip title={`${lowStockItems.length} productos con stock bajo (menos de 5 unidades)`}>
            <Badge count={lowStockItems.length} style={{ backgroundColor: '#faad14' }}>
              <WarningOutlined style={{ fontSize: '20px', color: '#faad14' }} />
            </Badge>
          </Tooltip>
          <span>Bienvenido, {user?.username}</span>
          <div style={{ paddingRight: '20px' }}>
            <Tooltip title="Cerrar Sesión">
              <Button 
                type="text" 
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
                style={{ fontSize: '18px' }}
              />
            </Tooltip>
          </div>
        </Header>
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: '#fff',
          minHeight: 280
        }}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <CustomerList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/items"
              element={
                <ProtectedRoute>
                  <ItemList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <SaleList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <UserList />
                </AdminRoute>
              }
            />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;

