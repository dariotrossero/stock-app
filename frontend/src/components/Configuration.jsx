import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Button, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const Configuration = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      const response = await api.get('/config/low-stock-threshold');
      if (response.data) {
        form.setFieldsValue({
          lowStockThreshold: response.data.threshold
        });
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const response = await api.post('/config/low-stock-threshold', {
        threshold: values.lowStockThreshold
      });
      
      if (response.status === 200) {
        // Success
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1>Configuración</h1>
      <Card title="Configuración de Stock" style={{ maxWidth: 600 }}>
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ lowStockThreshold: 3 }}
          >
            <Form.Item
              name="lowStockThreshold"
              label="Umbral de Stock Bajo"
              rules={[
                { required: true, message: 'Por favor ingrese el umbral de stock bajo' },
                { type: 'number', min: 1, message: 'El umbral debe ser mayor a 0' }
              ]}
              tooltip="Cuando el stock de un producto esté por debajo de este número, se mostrará una alerta"
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
                placeholder="Ingrese el umbral de stock bajo"
              />
            </Form.Item>
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
              >
                Guardar Configuración
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default Configuration; 