import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Badge, Tooltip, Modal, Table } from 'antd';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Cargar datos del usuario de forma segura
    let userData = null;
    try {
      const raw = localStorage.getItem('user');
      userData = raw ? JSON.parse(raw) : null;
      console.log('User data loaded:', userData); // Debug log
    } catch (e) {
      console.error('Error parsing user data:', e);
      userData = null;
    }
    setUser(userData);
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/items/');
      const itemsData = Array.isArray(response.data) ? response.data : [];
      const lowStock = itemsData.filter(item => item.stock < 3);
      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  useEffect(() => {
    // Cargar datos iniciales
    fetchItems();

    // Configurar intervalo para actualizar cada 30 segundos
    const intervalId = setInterval(fetchItems, 30000);

    // Limpiar intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, []);

  // Actualizar cuando cambia la ruta (por ejemplo, después de una venta)
  useEffect(() => {
    fetchItems();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: <Link to="/customers">Clientes</Link>,
    },
    {
      key: '/items',
      icon: <ShoppingOutlined />,
      label: <Link to="/items">Productos</Link>,
    },
    {
      key: '/sales',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/sales">Ventas</Link>,
    },
  ];

  // Agregar la opción de usuarios solo si el usuario es admin
  if (user && user.is_admin) {
    console.log('User is admin, adding users menu item'); // Debug log
    menuItems.push({
      key: '/users',
      icon: <TeamOutlined />,
      label: <Link to="/users">Usuarios</Link>,
    });
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0 }}>Sistema de Ventas</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {lowStockItems.length > 0 && (
            <Tooltip title="Ver productos con stock bajo">
              <Badge count={lowStockItems.length} size="small">
                <Button
                  type="text"
                  icon={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                  onClick={() => setIsStockModalVisible(true)}
                />
              </Badge>
            </Tooltip>
          )}
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: 'rgba(0, 0, 0, 0.85)' }}
          >
            Logout
          </Button>
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ 
            background: '#fff', 
            padding: 24, 
            margin: 0, 
            minHeight: 280,
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>

      {/* Modal de Stock Bajo */}
      <Modal
        title="Productos con Stock Bajo"
        open={isStockModalVisible}
        onCancel={() => setIsStockModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsStockModalVisible(false)}>
            Cerrar
          </Button>
        ]}
      >
        <Table
          dataSource={lowStockItems}
          columns={[
            {
              title: 'Producto',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: 'Stock Actual',
              dataIndex: 'stock',
              key: 'stock',
              render: (stock) => (
                <span style={{ color: stock === 0 ? '#ff4d4f' : '#faad14' }}>
                  {stock} unidades
                </span>
              )
            },
            {
              title: 'Stock Recomendado',
              key: 'recommended',
              render: () => '3 unidades'
            }
          ]}
          pagination={false}
        />
      </Modal>
    </Layout>
  );
};

export default AppLayout; 