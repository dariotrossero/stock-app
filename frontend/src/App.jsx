import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Badge, Tooltip, message } from 'antd';
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
  ExclamationCircleOutlined,
  AccountBookOutlined,
  SettingOutlined
} from '@ant-design/icons';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import ItemList from './components/ItemList';
import SaleList from './components/SaleList';
import UserList from './components/UserList';
import AccountStatement from './components/AccountStatement';
import Configuration from './components/Configuration';
import AdminRoute from './components/AdminRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import { api } from './services/api';

// Configurar el mensaje global
message.config({
  top: 100,
  duration: 3,
  maxCount: 3,
});

const { Header, Sider, Content } = Layout;

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated());
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const AppContent = () => {
  // 1. Hooks de contexto y navegación
  const { isAuthenticated, user, logout, isAdmin, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 2. Hooks de estado
  const [collapsed, setCollapsed] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [lowStockThreshold, setLowStockThreshold] = useState(3);

  // 3. Variables derivadas
  const isLoginPage = location.pathname === '/login';

  // 4. Efectos
  useEffect(() => {
    if (!isAuthenticated() && !isLoginPage) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoginPage, navigate]);

  useEffect(() => {
    if (isAuthenticated() && token) {
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
            setLowStockItems(data);
            if (data.length === 0) {
              console.log('No hay productos con stock bajo.');
            } else {
              console.log('Items con stock bajo recibidos:', data);
            }
          } else if (data && data.detail) {
            console.error('Error en la respuesta:', data.detail);
            setLowStockItems([]);
          } else {
            console.error('Respuesta inesperada:', data);
            setLowStockItems([]);
          }
        } catch (error) {
          console.error('Error al obtener items con stock bajo:', error);
          setLowStockItems([]);
        }
      };

      const fetchThreshold = async () => {
        try {
          const response = await api.get('/config/low-stock-threshold');
          if (response.data && response.data.threshold) {
            setLowStockThreshold(response.data.threshold);
          }
        } catch (error) {
          console.error('Error al obtener el umbral de stock bajo:', error);
        }
      };

      console.log('Usuario autenticado, obteniendo items con stock bajo...');
      fetchLowStockItems();
      fetchThreshold();
      const interval = setInterval(fetchLowStockItems, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  // 5. Logs de depuración
  console.log('AppContent - Current user:', user);
  console.log('AppContent - Is admin:', isAdmin());

  // 6. Renderizado condicional
  if (isLoginPage) {
    return <Login />;
  }

  if (!isAuthenticated()) {
    return null;
  }

  // 7. Handlers
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    logout();
    message.success('Sesión cerrada exitosamente');
    navigate('/login');
  };

  // 8. Configuración del menú
  const baseMenuItems = [
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
    {
      key: '/account-statement',
      icon: <AccountBookOutlined />,
      label: 'Cuenta Corriente',
    },
  ];

  const adminMenuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: 'Usuarios',
    },
    {
      key: '/config',
      icon: <SettingOutlined />,
      label: 'Configuración',
    },
  ];

  const menuItems = isAdmin() 
    ? [...adminMenuItems, ...baseMenuItems]
    : baseMenuItems;

  // 9. Renderizado principal
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
          {lowStockItems.length > 0 && (
            <Tooltip title={`${lowStockItems.length} productos con stock bajo (menos de ${lowStockThreshold} unidades)`}>
              <Badge count={lowStockItems.length} style={{ backgroundColor: '#faad14' }}>
                <WarningOutlined style={{ fontSize: '20px', color: '#faad14' }} />
              </Badge>
            </Tooltip>
          )}
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
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
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
              path="/account-statement"
              element={
                <ProtectedRoute>
                  <AccountStatement />
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
            <Route
              path="/config"
              element={
                <AdminRoute>
                  <Configuration />
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

