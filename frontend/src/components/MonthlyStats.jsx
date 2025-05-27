import React, { useState, useEffect } from 'react';
import { Card, Statistic, Spin } from 'antd';
import { ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const MonthlyStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats/monthly');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching monthly stats:', err);
        setError('Error al cargar estadísticas mensuales');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

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
    <Card title="Estadísticas del Último Mes" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <Statistic
          title="Total de Ventas"
          value={stats?.total_sales || 0}
          prefix={<ShoppingCartOutlined />}
        />
        <Statistic
          title="Ingresos Totales"
          value={stats?.total_income || 0}
          prefix={<DollarOutlined />}
          formatter={(value) => formatCurrency(value)}
        />
      </div>
    </Card>
  );
};

export default MonthlyStats; 