import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Space, Badge, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ItemList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingItem, setEditingItem] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 100,
    total: 0
  });
  const nameInputRef = useRef(null);

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check if Ctrl + N is pressed
      if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        handleAdd();
        message.info('Creando nuevo producto...');
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const fetchItems = async (page = 1, pageSize = 100, search = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Current token:', token);
      
      if (!token) {
        message.error('No authentication token found. Please log in.');
        navigate('/login');
        return;
      }

      console.log('Fetching items...');
      console.log('API URL:', api.defaults.baseURL + '/items/');
      console.log('Request headers:', api.defaults.headers);
      
      const skip = (page - 1) * pageSize;
      const response = await api.get(`/items/?skip=${skip}&limit=${pageSize}&search=${search}`);
      console.log('Full API Response:', response);
      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);
      console.log('API Response data:', response.data);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      const itemsData = response.data;
      console.log('Items data before processing:', itemsData);

      if (!Array.isArray(itemsData)) {
        console.error('Invalid items data format:', itemsData);
        throw new Error('Invalid data format received from server');
      }
      
      // Process items to ensure all fields are properly formatted
      const processedItems = itemsData.map(item => {
        const processed = {
          id: item.id,
          name: item.name || '',
          description: item.description || '',
          price: parseFloat(item.price) || 0,
          stock: parseInt(item.stock) || 0,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
        console.log('Processed item:', processed);
        return processed;
      });

      console.log('Final processed items:', processedItems);
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        current: page,
        total: processedItems.length === pageSize ? page * pageSize + 1 : page * pageSize
      }));
      
      // Update items state
      setItems(processedItems);
      setFilteredItems(processedItems);

      return processedItems;
    } catch (error) {
      console.error('Error fetching items:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });
      
      if (error.response?.status === 401) {
        message.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        message.error('Error al cargar los productos');
      }
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect for initial data loading
  useEffect(() => {
    const loadData = async () => {
      await fetchItems(1, pagination.pageSize, searchText);
      // Fetch low stock items separately
      try {
        const lowStockResponse = await api.get('/items/low-stock');
        console.log('Low stock response:', lowStockResponse);
        if (lowStockResponse.data && Array.isArray(lowStockResponse.data)) {
          console.log('Setting low stock items:', lowStockResponse.data);
          setLowStockItems(lowStockResponse.data);
        }
      } catch (error) {
        console.error('Error fetching low stock items:', error);
      }
    };
    loadData();
  }, [searchText]);

  // Add useEffect for state logging
  useEffect(() => {
    console.log('State update - Current items:', {
      itemsCount: items.length,
      items: items,
      firstItem: items[0],
      lastItem: items[items.length - 1]
    });
    console.log('State update - Current filtered items:', {
      filteredCount: filteredItems.length,
      filteredItems: filteredItems,
      firstFiltered: filteredItems[0],
      lastFiltered: filteredItems[filteredItems.length - 1]
    });
  }, [items, filteredItems]);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
    // Focus on name input after modal is visible
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 100);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/items/${id}`);
      message.success('Producto eliminado exitosamente');
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        message.error('Error al eliminar el producto');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Submitting values:', values);
      
      let response;
      
      if (editingItem) {
        response = await api.put(`/items/${editingItem.id}`, values);
        console.log('Update response:', response.data);
        message.success('Producto actualizado exitosamente');
        // For updates, we'll refresh the list
        await fetchItems();
      } else {
        response = await api.post('/items/', values);
        console.log('Create response:', response.data);
        
        if (!response.data) {
          throw new Error('No data received from server');
        }
        
        // Add the new item to the beginning of the list with all fields
        const newItem = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description || '',
          price: parseFloat(response.data.price) || 0,
          stock: parseInt(response.data.stock) || 0,
          created_at: response.data.created_at,
          updated_at: response.data.updated_at
        };
        
        console.log('New item to be added:', newItem);
        
        // Update both items and filteredItems
        setItems(prevItems => {
          const updatedItems = [newItem, ...prevItems];
          console.log('Updated items array:', updatedItems);
          return updatedItems;
        });
        
        // Update filtered items based on current search
        setFilteredItems(prevItems => {
          if (searchText) {
            // If there's a search term, check if the new item matches
            const matchesSearch = 
              newItem.name.toLowerCase().includes(searchText.toLowerCase()) ||
              (newItem.description && newItem.description.toLowerCase().includes(searchText.toLowerCase()));
            
            console.log('Search match result:', { newItem, searchText, matchesSearch });
            
            if (matchesSearch) {
              return [newItem, ...prevItems];
            }
            return prevItems;
          }
          // If no search term, add the new item at the beginning
          return [newItem, ...prevItems];
        });
        
        // Set the highlighted item
        setHighlightedItemId(newItem.id);
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedItemId(null);
        }, 3000);
        
        message.success('Producto creado exitosamente');
      }

      setIsModalVisible(false);
    } catch (error) {
      console.error('Error saving item:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        message.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        message.error(`Error al guardar el producto: ${error.message}`);
      }
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    console.log('Table change:', { pagination, filters, sorter });
    fetchItems(pagination.current, pagination.pageSize, searchText);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ['ascend', 'descend'],
      render: (text, record) => (
        <span style={{
          backgroundColor: record.id === highlightedItemId ? '#e6f7ff' : 'transparent',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'background-color 0.3s ease'
        }}>
          {text}
        </span>
      )
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      sorter: (a, b) => {
        const descA = a.description || '';
        const descB = b.description || '';
        return descA.localeCompare(descB);
      },
      sortDirections: ['ascend', 'descend'],
      render: (text, record) => (
        <span style={{
          backgroundColor: record.id === highlightedItemId ? '#e6f7ff' : 'transparent',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'background-color 0.3s ease'
        }}>
          {text}
        </span>
      )
    },
    {
      title: 'Precio',
      dataIndex: 'price',
      key: 'price',
      sorter: (a, b) => a.price - b.price,
      sortDirections: ['ascend', 'descend'],
      render: (value, record) => (
        <span style={{
          backgroundColor: record.id === highlightedItemId ? '#e6f7ff' : 'transparent',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'background-color 0.3s ease'
        }}>
          ${value.toFixed(2)}
        </span>
      )
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
      sortDirections: ['ascend', 'descend'],
      render: (value, record) => (
        <span style={{
          backgroundColor: record.id === highlightedItemId ? '#e6f7ff' : 'transparent',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'background-color 0.3s ease',
          color: value < 3 ? '#faad14' : value === 0 ? '#ff4d4f' : 'inherit'
        }}>
          {value} unidades
        </span>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space style={{
          backgroundColor: record.id === highlightedItemId ? '#e6f7ff' : 'transparent',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'background-color 0.3s ease'
        }}>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ marginRight: 8 }}
          />
          <Popconfirm
            title="Eliminar producto"
            description="¿Está seguro de que desea eliminar este producto?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<DeleteOutlined />}
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input
          placeholder="Buscar productos..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Space>
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
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Nuevo Producto
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        loading={loading}
      />

      <Modal
        title={editingItem ? 'Editar Producto' : 'Nuevo Producto'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Nombre"
            rules={[{ required: true, message: 'Por favor ingrese el nombre' }]}
          >
            <Input ref={nameInputRef} />
          </Form.Item>
          <Form.Item
            name="description"
            label="Descripción"
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="price"
            label="Precio"
            rules={[{ required: true, message: 'Por favor ingrese el precio' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              prefix="$"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="stock"
            label="Stock"
            rules={[{ required: true, message: 'Por favor ingrese el stock' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

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
    </div>
  );
};

export default ItemList; 