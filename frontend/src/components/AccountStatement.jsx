import React, { useState, useEffect } from 'react';
import { Table, Select, Card, Descriptions, Badge, Space, Typography, DatePicker, Button, Modal, Form, Input, InputNumber, message } from 'antd';
import { api } from '../services/api';
import dayjs from 'dayjs';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const AccountStatement = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isSaleModalVisible, setIsSaleModalVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentForm] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerSales();
      fetchCustomerPayments();
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
      const response = await api.get(`/customers/${selectedCustomer}/pending-sales/`);
      let filteredSales = response.data;

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

  const fetchCustomerPayments = async () => {
    if (!selectedCustomer) return;
    
    try {
      const response = await api.get(`/customers/${selectedCustomer}/payments/`);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const calculateTotalDebt = () => {
    const totalSales = sales.reduce((total, sale) => total + sale.total_amount, 0);
    const totalPayments = payments.reduce((total, payment) => total + payment.amount, 0);
    return totalSales - totalPayments;
  };

  const handlePaymentSubmit = async (values) => {
    try {
      await api.post('/payments/', {
        customer_id: selectedCustomer,
        sale_id: values.sale_id || null,
        amount: values.amount,
        description: values.description
      });

      message.success('Pago registrado exitosamente');
      setIsPaymentModalVisible(false);
      paymentForm.resetFields();
      fetchCustomerSales();
      fetchCustomerPayments();
    } catch (error) {
      console.error('Error creating payment:', error);
      message.error('Error al registrar el pago');
    }
  };

  const handleViewSale = async (saleId) => {
    try {
      const response = await api.get(`/sales/${saleId}`);
      setSelectedSale(response.data);
      setIsSaleModalVisible(true);
    } catch (error) {
      console.error('Error fetching sale details:', error);
      message.error('Error al cargar los detalles de la venta');
    }
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
      render: (id) => (
        <Button 
          type="link" 
          onClick={() => handleViewSale(id)}
          icon={<EyeOutlined />}
        >
          {id}
        </Button>
      ),
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

  const paymentColumns = [
    {
      title: 'Fecha',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
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

            {selectedCustomer && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsPaymentModalVisible(true)}
              >
                Registrar Pago
              </Button>
            )}
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

        <Card title="Ventas Pendientes">
          <Table
            columns={columns}
            dataSource={sales}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Card title="Historial de Pagos">
          <Table
            columns={paymentColumns}
            dataSource={payments}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>

      <Modal
        title="Registrar Pago"
        open={isPaymentModalVisible}
        onCancel={() => {
          setIsPaymentModalVisible(false);
          paymentForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={paymentForm}
          onFinish={handlePaymentSubmit}
          layout="vertical"
        >
          <Form.Item
            name="sale_id"
            label="Venta (opcional)"
          >
            <Select
              placeholder="Seleccionar venta"
              allowClear
            >
              {sales.map(sale => (
                <Select.Option key={sale.id} value={sale.id}>
                  Venta #{sale.id} - ${sale.total_amount.toFixed(2)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Monto"
            rules={[{ required: true, message: 'Por favor ingrese el monto' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descripción"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Registrar Pago
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Detalles de Venta #${selectedSale?.id}`}
        open={isSaleModalVisible}
        onCancel={() => {
          setIsSaleModalVisible(false);
          setSelectedSale(null);
        }}
        footer={null}
        width={800}
      >
        {selectedSale && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Cliente" span={2}>
                {selectedSale.customer.name}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha">
                {dayjs(selectedSale.created_at).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                ${selectedSale.total_amount.toFixed(2)}
              </Descriptions.Item>
            </Descriptions>

            <Table
              dataSource={selectedSale.items}
              columns={[
                {
                  title: 'Producto',
                  dataIndex: ['item', 'name'],
                  key: 'name',
                },
                {
                  title: 'Cantidad',
                  dataIndex: 'quantity',
                  key: 'quantity',
                },
                {
                  title: 'Precio Unitario',
                  dataIndex: 'unit_price',
                  key: 'unit_price',
                  render: (price) => `$${price.toFixed(2)}`,
                },
                {
                  title: 'Subtotal',
                  dataIndex: 'subtotal',
                  key: 'subtotal',
                  render: (subtotal) => `$${subtotal.toFixed(2)}`,
                },
              ]}
              pagination={false}
              rowKey="id"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AccountStatement; 