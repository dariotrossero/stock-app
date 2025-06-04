import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Space, Badge, Tooltip, Select } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, ExclamationCircleOutlined, InboxOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ItemList = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
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
  const [loadingStockUpdates, setLoadingStockUpdates] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 100,
    total: 0
  });
  const [sorting, setSorting] = useState({
    field: null,
    order: null
  });
  const nameInputRef = useRef(null);
  const [isStockUpdateModalVisible, setIsStockUpdateModalVisible] = useState(false);
  const [stockUpdateForm] = Form.useForm();
  const [stockUpdates, setStockUpdates] = useState([]);
  const [allItems, setAllItems] = useState([]);

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

  const fetchItems = async (page = 1, pageSize = 100, search = '', sortField = null, sortOrder = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('No authentication token found. Please log in.');
        navigate('/login');
        return;
      }

      const skip = (page - 1) * pageSize;
      let url = `/items/?skip=${skip}&limit=${pageSize}&search=${search}`;
      
      if (sortField && sortOrder) {
        const order = sortOrder === 'ascend' ? 'asc' : 'desc';
        url += `&sort_by=${sortField}&sort_order=${order}`;
      }

      const response = await api.get(url);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      const itemsData = response.data;
      
      if (!Array.isArray(itemsData)) {
        console.error('Invalid items data format:', itemsData);
        throw new Error('Invalid data format received from server');
      }
      
      const processedItems = itemsData.map(item => ({
        id: item.id,
        name: item.name || '',
        description: item.description || '',
        price: parseFloat(item.price) || 0,
        stock: parseInt(item.stock) || 0,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setPagination(prev => ({
        ...prev,
        current: page,
        total: processedItems.length === pageSize ? page * pageSize + 1 : page * pageSize
      }));
      
      setItems(processedItems);
      setFilteredItems(processedItems);

      return processedItems;
    } catch (error) {
      console.error('Error fetching items:', error);
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

  const fetchAllItems = async () => {
    try {
      const response = await api.get('/items/?skip=0&limit=1000'); // Fetch a large number of items
      if (response.data && Array.isArray(response.data)) {
        const processedItems = response.data.map(item => ({
          id: item.id,
          name: item.name || '',
          description: item.description || '',
          price: parseFloat(item.price) || 0,
          stock: parseInt(item.stock) || 0,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        setAllItems(processedItems);
        return processedItems;
      }
      return [];
    } catch (error) {
      console.error('Error fetching all items:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadingStockUpdates(true);
      try {
        // Load all items for stock updates
        await fetchAllItems();
        
        // Load paginated items for the table
        await fetchItems(1, pagination.pageSize, searchText);
        
        // Load stock updates
        try {
          const stockUpdatesResponse = await api.get('/stock-updates/');
          if (stockUpdatesResponse.data && Array.isArray(stockUpdatesResponse.data)) {
            setStockUpdates(stockUpdatesResponse.data);
          }
        } catch (error) {
          console.error('Error fetching stock updates:', error);
        }

        // Load low stock items
        try {
          const lowStockResponse = await api.get('/items/low-stock');
          if (lowStockResponse.data && Array.isArray(lowStockResponse.data)) {
            setLowStockItems(lowStockResponse.data);
          }
        } catch (error) {
          console.error('Error fetching low stock items:', error);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
        setLoadingStockUpdates(false);
      }
    };
    loadData();
  }, [searchText]);

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
    const { field, order } = sorter;
    setSorting({ field, order });
    fetchItems(pagination.current, pagination.pageSize, searchText, field, order);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStockUpdate = async () => {
    try {
      setLoadingStockUpdates(true);
      const values = await stockUpdateForm.validateFields();
      
      const response = await api.post('/stock-updates/', values);
      
      message.success('Stock actualizado exitosamente');
      setIsStockUpdateModalVisible(false);
      stockUpdateForm.resetFields();
      
      // Refresh all items for stock updates
      await fetchAllItems();
      
      // Refresh paginated items for the table
      await fetchItems(pagination.current, pagination.pageSize, searchText);
      
      // Get stock updates
      const stockUpdatesResponse = await api.get('/stock-updates/');
      if (stockUpdatesResponse.data && Array.isArray(stockUpdatesResponse.data)) {
        setStockUpdates(stockUpdatesResponse.data);
      }
      
      // Get low stock items
      const lowStockResponse = await api.get('/items/low-stock');
      if (lowStockResponse.data && Array.isArray(lowStockResponse.data)) {
        setLowStockItems(lowStockResponse.data);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      message.error('Error al actualizar el stock');
    } finally {
      setLoadingStockUpdates(false);
    }
  };

  const handleLoadDummyData = async () => {
    try {
      console.log('Intentando cargar datos de prueba...');
      const response = await fetch('http://localhost:8000/load-dummy-data/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar datos de prueba');
      }

      message.success('Datos de prueba cargados exitosamente');
      // Recargar los datos
      await fetchItems(1, pagination.pageSize, searchText);
      await fetchAllItems();
    } catch (error) {
      console.error('Error al cargar datos de prueba:', error);
      message.error('Error al cargar datos de prueba');
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
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
      sorter: true,
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
      sorter: true,
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
      sorter: true,
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Nuevo Producto
          </Button>
          <Input
            placeholder="Buscar productos..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            icon={<ExclamationCircleOutlined />}
            onClick={() => setIsStockModalVisible(true)}
            disabled={lowStockItems.length === 0}
            style={{ backgroundColor: lowStockItems.length > 0 ? '#faad14' : undefined }}
          >
            Stock Bajo ({lowStockItems.length})
          </Button>
          <Button
            type="primary"
            icon={<InboxOutlined />}
            onClick={() => setIsStockUpdateModalVisible(true)}
          >
            Actualizar Stock
          </Button>
          {isAdmin() && (
            <Button
              type="primary"
              onClick={handleLoadDummyData}
              style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
            >
              Cargar Datos de Prueba
            </Button>
          )}
        </div>
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

      {/* Modal de Actualización de Stock */}
      <Modal
        title="Actualizar Stock"
        open={isStockUpdateModalVisible}
        onOk={handleStockUpdate}
        onCancel={() => {
          setIsStockUpdateModalVisible(false);
          stockUpdateForm.resetFields();
        }}
      >
        <Form
          form={stockUpdateForm}
          layout="vertical"
        >
          <Form.Item
            name="item_id"
            label="Producto"
            rules={[{ required: true, message: 'Por favor seleccione un producto' }]}
          >
            <Select
              placeholder="Seleccione un producto"
              showSearch
              optionFilterProp="children"
            >
              {allItems.map(item => (
                <Select.Option key={item.id} value={item.id}>
                  {item.name} (Stock actual: {item.stock})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Cantidad"
            rules={[{ required: true, message: 'Por favor ingrese la cantidad' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Ingrese un número positivo para agregar o negativo para reducir"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Tabla de Historial de Actualizaciones de Stock */}
      <div style={{ marginTop: 24 }}>
        <h3>Historial de Actualizaciones de Stock</h3>
        <Table
          dataSource={stockUpdates}
          rowKey="id"
          pagination={false}
          loading={loadingStockUpdates}
          columns={[
            {
              title: 'Producto',
              dataIndex: 'item_id',
              key: 'item_id',
              render: (itemId) => {
                const item = allItems.find(i => Number(i.id) === Number(itemId));
                if (loadingStockUpdates) {
                  return 'Cargando...';
                }
                if (!item) {
                  return 'Producto no encontrado';
                }
                return item.name;
              }
            },
            {
              title: 'Cantidad',
              dataIndex: 'quantity',
              key: 'quantity',
              render: (quantity) => (
                <span style={{ color: quantity > 0 ? '#52c41a' : '#ff4d4f' }}>
                  {quantity > 0 ? `+${quantity}` : quantity}
                </span>
              )
            },
            {
              title: 'Fecha',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (date) => new Date(date).toLocaleString()
            }
          ]}
        />
      </div>
    </div>
  );
};

export default ItemList; 