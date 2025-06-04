import React, { useState, useEffect } from 'react';
import { Table, Select, Card, Descriptions, Badge, Space, Typography, DatePicker } from 'antd';
import { api } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const AccountStatement = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerSales();
    }
  }, [selectedCustomer, dateRange]);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers/');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCustomerSales = async () => {
    if (!selectedCustomer) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/sales/`);
      let filteredSales = response.data.filter(sale => 
        sale.customer_id === selectedCustomer && 
        !sale.paid
      );

      if (dateRange) {
        filteredSales = filteredSales.filter(sale => {
          const saleDate = dayjs(sale.created_at);
          return saleDate.isAfter(dateRange[0]) && saleDate.isBefore(dateRange[1]);
        });
      }

      setSales(filteredSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDebt = () => {
    return sales.reduce((total, sale) => total + sale.total_amount, 0);
  };

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Número de Venta',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Monto',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `$${amount.toFixed(2)}`,
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: 'Estado',
      key: 'status',
      render: (_, record) => (
        <Badge 
          status={record.paid ? "success" : "warning"} 
          text={record.paid ? "Pagado" : "Pendiente"} 
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Cuenta Corriente</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space>
            <Select
              style={{ width: 300 }}
              placeholder="Seleccionar cliente"
              onChange={setSelectedCustomer}
              value={selectedCustomer}
              showSearch
              optionFilterProp="children"
            >
              {customers.map(customer => (
                <Select.Option key={customer.id} value={customer.id}>
                  {customer.name}
                </Select.Option>
              ))}
            </Select>

            <RangePicker
              onChange={setDateRange}
              value={dateRange}
              allowClear
              format="DD/MM/YYYY"
            />
          </Space>
        </Card>

        {selectedCustomer && (
          <Card>
            <Descriptions title="Resumen" bordered>
              <Descriptions.Item label="Cliente">
                {customers.find(c => c.id === selectedCustomer)?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Total Deuda">
                ${calculateTotalDebt().toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Cantidad de Ventas">
                {sales.length}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <Table
          columns={columns}
          dataSource={sales}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Space>
    </div>
  );
};

export default AccountStatement; 