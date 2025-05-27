import React, { useState, useEffect } from 'react';
import { Card, Table, Spin } from 'antd';
import { api } from '../services/api';

const TopProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await api.get('/stats/top-products');
        setProducts(response.data);
      } catch (err) {
        console.error('Error fetching top products:', err);
        setError('Error al cargar productos más vendidos');
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  const columns = [
    {
      title: 'Producto',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Unidades Vendidas',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      sorter: (a, b) => a.total_quantity - b.total_quantity,
    },
    {
      title: 'Monto Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      sorter: (a, b) => a.total_amount - b.total_amount,
      render: (value) => `$${value.toFixed(2)}`,
    },
  ];

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: 'center', color: 'red' }}>
          {error}
        </div>
      </Card>
    );
  }

  return (
    <Card title="Productos Más Vendidos">
      <Table
        dataSource={products}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Card>
  );
};

export default TopProducts; 