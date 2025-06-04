import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin } from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  DollarOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import MonthlyStats from './MonthlyStats';
import TopProducts from './TopProducts';
import { Table } from 'antd';

const { Title } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_sales: 0,
    total_revenue: 0,
    total_customers: 0,
    total_items: 0
  });
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [topDebtors, setTopDebtors] = useState([]);

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Obtener estadísticas de clientes
      const customersResponse = await fetch('http://localhost:8000/customers/', { headers });
      const customers = await customersResponse.json();

      // Obtener estadísticas de productos
      const itemsResponse = await fetch('http://localhost:8000/items/', { headers });
      const items = await itemsResponse.json();

      // Obtener estadísticas de ventas
      const salesResponse = await fetch('http://localhost:8000/sales/', { headers });
      const sales = await salesResponse.json();

      // Calcular el total de ingresos
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);

      setStats({
        total_customers: customers.length,
        total_items: items.length,
        total_sales: sales.length,
        total_revenue: totalRevenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, productsRes, lowStockRes, debtorsRes] = await Promise.all([
        api.get('/stats/monthly'),
        api.get('/stats/top-products'),
        api.get('/items/low-stock'),
        api.get('/stats/top-debtors')
      ]);

      setMonthlyStats(statsRes.data);
      setTopProducts(productsRes.data);
      setLowStockItems(lowStockRes.data);
      setTopDebtors(debtorsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const topProductsColumns = [
    {
      title: 'Producto',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Cantidad Vendida',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
    },
    {
      title: 'Total Vendido',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `$${amount.toFixed(2)}`,
    },
  ];

  const lowStockColumns = [
    {
      title: 'Producto',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Stock Actual',
      dataIndex: 'stock',
      key: 'stock',
    },
  ];

  const debtorsColumns = [
    {
      title: 'Cliente',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Deuda Total',
      dataIndex: 'total_debt',
      key: 'total_debt',
      render: (amount) => `$${amount.toFixed(2)}`,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dashboard</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable 
            onClick={() => navigate('/sales')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Ventas Totales"
              value={stats.total_sales}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ingresos Totales"
              value={stats.total_revenue}
              prefix={<DollarOutlined />}
              precision={2}
              formatter={(value) => formatCurrency(value)}      
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable 
            onClick={() => navigate('/customers')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Clientes Totales"
              value={stats.total_customers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable 
            onClick={() => navigate('/items')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Productos Totales"
              value={stats.total_items}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <MonthlyStats />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <TopProducts />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ventas del Mes"
              value={monthlyStats?.total_sales || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ingresos del Mes"
              value={monthlyStats?.total_income || 0}
              precision={2}
              prefix={<DollarOutlined />}
              formatter={(value) => `$${value}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Productos con Stock Bajo"
              value={lowStockItems.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Clientes"
              value={topDebtors.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} lg={12}>
          <Card title="Productos Más Vendidos">
            <Table
              dataSource={topProducts}
              columns={topProductsColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Productos con Stock Bajo">
            <Table
              dataSource={lowStockItems}
              columns={lowStockColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24}>
          <Card title="Clientes con Mayor Deuda">
            <Table
              dataSource={topDebtors}
              columns={debtorsColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 