import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, message, Space, Descriptions, AutoComplete, Badge, Tooltip, Input, DatePicker, Checkbox, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const SaleList = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [form] = Form.useForm();
  const [saleItems, setSaleItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [lastAddedIndex, setLastAddedIndex] = useState(null);
  const autoCompleteRefs = useRef({});
  const customerSelectRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [newSale, setNewSale] = useState({
    customer_id: null,
    items: [{ item_id: null, item_name: '', quantity: 1, unit_price: 0, max_quantity: 0 }],
    total_amount: 0
  });
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [highlightedSaleId, setHighlightedSaleId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        handleAdd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchSales = async () => {
    try {
      console.log("Fetching sales...");
      const response = await fetch("http://localhost:8000/sales/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      
      if (!Array.isArray(data)) {
        console.error("Expected array of sales but got:", typeof data);
        setError("Error: Invalid response format");
        return;
      }
      
      console.log(`Found ${data.length} sales`);
      data.forEach(sale => {
        console.log("Sale:", {
          id: sale.id,
          customer: sale.customer,
          user: sale.user,
          items: sale.items,
          total_amount: sale.total_amount,
          created_at: sale.created_at
        });
      });
      
      setSales(data);
      setFilteredSales(data);
    } catch (error) {
      console.error("Error fetching sales:", error);
      if (error.response) {
        console.error("Error response:", error.response);
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
      }
      setError("Error al cargar las ventas");
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers/');
      const customersData = Array.isArray(response.data) ? response.data : [];
      setCustomers(customersData);
    } catch (error) {
      message.error('Error al cargar los clientes');
      setCustomers([]);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await api.get('/items/');
      const itemsData = Array.isArray(response.data) ? response.data : [];
      console.log('Items cargados:', itemsData);
      const item3 = itemsData.find(item => item.id === 3);
      console.log('Detalles del producto 3:', item3);
      setItems(itemsData);
    } catch (error) {
      message.error('Error al cargar los productos');
      setItems([]);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchItems();
  }, []);

  useEffect(() => {
    if (lastAddedIndex !== null && autoCompleteRefs.current[lastAddedIndex]) {
      autoCompleteRefs.current[lastAddedIndex].focus();
      setLastAddedIndex(null);
    }
  }, [lastAddedIndex, saleItems]);

  useEffect(() => {
    // Actualizar lowStockItems cuando cambian los items
    const lowStock = items.filter(item => item.stock < 3);
    setLowStockItems(lowStock);
  }, [items]);

  useEffect(() => {
    if (searchText || dateRange) {
      const filtered = sales.filter(sale => {
        const matchesSearch = 
          sale.id.toString().includes(searchText) ||
          (sale.customer?.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
          sale.total_amount.toString().includes(searchText);

        const matchesDate = dateRange ? 
          dayjs(sale.created_at).isAfter(dateRange[0], 'day') && 
          dayjs(sale.created_at).isBefore(dateRange[1], 'day') :
          true;

        return matchesSearch && matchesDate;
      });
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  }, [searchText, dateRange, sales]);

  const handleAdd = () => {
    setSaleItems([]);
    form.resetFields();
    setIsModalVisible(true);
    // Enfocar el campo de cliente después de que el modal se abra
    setTimeout(() => {
      if (customerSelectRef.current) {
        customerSelectRef.current.focus();
      }
    }, 300);
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/sales/${id}/`);
      if (response.status === 200) {
        message.success('Venta eliminada exitosamente');
        fetchSales();
      } else {
        message.error('Error al eliminar la venta');
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      if (error.response?.status === 404) {
        message.error('La venta no existe o ya fue eliminada');
      } else if (error.response?.status === 401) {
        message.error('No tiene permisos para eliminar ventas');
      } else {
        message.error('Error al eliminar la venta. Por favor, intente nuevamente.');
      }
    }
  };

  const addSaleItem = () => {
    const newIndex = saleItems.length;
    setSaleItems([...saleItems, { 
      item_id: null, 
      quantity: 1, 
      unit_price: 0,
      max_quantity: 0,
      item_name: '',
      subtotal: 0
    }]);
    setLastAddedIndex(newIndex);
  };

  const removeSaleItem = (index) => {
    const newItems = [...saleItems];
    newItems.splice(index, 1);
    setSaleItems(newItems);
  };

  const updateSaleItem = (index, field, value) => {
    const newItems = [...saleItems];
    const currentItem = { ...newItems[index] };
    
    if (field === 'item_id') {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        console.log('Producto seleccionado:', selectedItem);
        console.log('Stock del producto:', selectedItem.stock);
        currentItem.item_id = selectedItem.id;
        currentItem.unit_price = selectedItem.price;
        currentItem.max_quantity = selectedItem.stock;
        currentItem.item_name = selectedItem.name;
        console.log('max_quantity establecido:', currentItem.max_quantity);
        if (currentItem.quantity > selectedItem.stock) {
          currentItem.quantity = selectedItem.stock;
          message.warning(`Stock disponible: ${selectedItem.stock} unidades`);
        }
      }
    } else if (field === 'quantity') {
      const quantity = Number(value);
      console.log('Intentando establecer cantidad:', quantity);
      console.log('max_quantity actual:', currentItem.max_quantity);
      if (!isNaN(quantity)) {
        const maxQuantity = currentItem.max_quantity || 0;
        if (quantity > maxQuantity) {
          console.log('Cantidad excede el stock máximo');
          message.warning(`Stock disponible: ${maxQuantity} unidades`);
          currentItem.quantity = maxQuantity;
        } else if (quantity <= 0) {
          currentItem.quantity = 1;
        } else {
          currentItem.quantity = quantity;
        }
      }
    } else {
      currentItem[field] = value;
    }
    
    currentItem.subtotal = currentItem.quantity * currentItem.unit_price;
    
    newItems[index] = currentItem;
    setSaleItems(newItems);
  };

  const calculateTotal = () => {
    return saleItems.reduce((total, item) => total + (item.subtotal || 0), 0);
  };

  const handleEdit = (sale) => {
    setIsEditing(true);
    setSelectedSale(sale);
    form.setFieldsValue({
      customer_id: sale.customer_id
    });
    
    // Convertir los items de la venta al formato esperado por el formulario
    const formattedItems = sale.items.map(item => ({
      item_id: item.item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      max_quantity: item.item.stock + item.quantity, // Stock actual + cantidad en la venta
      item_name: item.item.name,
      subtotal: item.subtotal
    }));
    
    setSaleItems(formattedItems);
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    let saleData = null;
    try {
      const values = await form.validateFields();
      
      // Validar que no se exceda el stock en ningún item
      const hasInvalidQuantity = saleItems.some(item => {
        const product = items.find(p => p.id === item.item_id);
        console.log('Validando stock para item:', item.item_id);
        console.log('Stock del producto:', product?.stock);
        console.log('Cantidad solicitada:', item.quantity);
        const availableStock = isEditing && selectedSale ? 
          (product?.stock || 0) + (selectedSale.items.find(i => i.item_id === item.item_id)?.quantity || 0) :
          (product?.stock || 0);
        console.log('Stock disponible:', availableStock);
        const isInvalid = item.quantity > availableStock;
        if (isInvalid) {
          console.log('Cantidad inválida detectada:', {
            itemId: item.item_id,
            requestedQuantity: item.quantity,
            availableStock: availableStock
          });
        }
        return isInvalid;
      });

      if (hasInvalidQuantity) {
        message.error('La cantidad de algunos productos excede el stock disponible');
        return;
      }

      // Validar que haya al menos un producto
      if (saleItems.length === 0) {
        message.error('Debe agregar al menos un producto a la venta');
        return;
      }

      // Validar que todos los productos estén seleccionados
      const hasUnselectedItems = saleItems.some(item => !item.item_id);
      if (hasUnselectedItems) {
        message.error('Todos los productos deben estar completamente seleccionados');
        return;
      }

      // Preparar los datos de la venta
      saleData = {
        total_amount: parseFloat(calculateTotal().toFixed(2)),
        items: saleItems.map(item => ({
          item_id: parseInt(item.item_id),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price.toFixed(2))
        })),
        paid: values.paid || false
      };

      if (isEditing) {
        const response = await api.put(`/sales/${selectedSale.id}`, saleData);
        message.success('Venta actualizada exitosamente');
      } else {
        saleData.customer_id = parseInt(values.customer_id);
        // Verificar el stock una vez más antes de enviar
        const stockCheck = await Promise.all(saleData.items.map(async (item) => {
          const response = await api.get(`/items/${item.item_id}/`);
          console.log(`Stock actual del item ${item.item_id}:`, response.data.stock);
          return {
            item_id: item.item_id,
            requested: item.quantity,
            available: response.data.stock
          };
        }));
        console.log('Verificación final de stock:', stockCheck);
        
        // Asegurarnos de que los datos estén en el formato correcto
        const formattedSaleData = {
          total_amount: parseFloat(saleData.total_amount.toFixed(2)),
          customer_id: parseInt(saleData.customer_id),
          items: saleData.items.map(item => ({
            item_id: parseInt(item.item_id),
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.unit_price.toFixed(2))
          })),
          paid: saleData.paid
        };
        
        console.log('Datos de la venta a enviar (formateados):', JSON.stringify(formattedSaleData, null, 2));
        try {
          const response = await api.post('/sales', formattedSaleData);
          console.log('Respuesta del servidor:', response.data);
          message.success('Venta creada exitosamente');
          // Establecer el ID de la venta recién creada para resaltarla
          setHighlightedSaleId(response.data.id);
          // Remover el resaltado después de 3 segundos
          setTimeout(() => {
            setHighlightedSaleId(null);
          }, 3000);
        } catch (error) {
          console.error('Error al crear la venta:', error);
          if (error.response) {
            console.error('Detalles del error:', {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers
            });
            if (error.response.data) {
              message.error(`Error: ${JSON.stringify(error.response.data)}`);
            } else {
              message.error('Error al crear la venta. Por favor, intente nuevamente.');
            }
          }
          throw error;
        }
      }
      
      setIsModalVisible(false);
      setIsEditing(false);
      setSelectedSale(null);
      fetchSales();
    } catch (error) {
      console.error('Error completo:', error);
      if (saleData) {
        console.error('Datos de la venta que causaron el error:', JSON.stringify(saleData, null, 2));
      }
      
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
        console.error('Estado de la respuesta:', error.response.status);
        console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 400) {
          const errorData = error.response.data;
          if (typeof errorData === 'object') {
            const errorMessages = Object.entries(errorData)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n');
            message.error(`Error en los datos de la venta:\n${errorMessages}`);
          } else {
            message.error(`Error en los datos de la venta: ${errorData}`);
          }
        } else if (error.response.status === 401) {
          message.error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        } else if (error.response.status === 403) {
          message.error('No tiene permisos para realizar esta acción.');
        } else if (error.response.status === 404) {
          message.error('El recurso solicitado no existe.');
        } else if (error.response.status === 422) {
          message.error('Error de validación en los datos de la venta.');
        } else if (error.response.status === 500) {
          message.error('Error interno del servidor. Por favor, intente nuevamente.');
        } else {
          message.error(`Error del servidor (${error.response.status}): ${JSON.stringify(error.response.data)}`);
        }
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor:', error.request);
        message.error('No se recibió respuesta del servidor. Por favor, verifique que el servidor esté funcionando.');
      } else {
        console.error('Error al configurar la petición:', error.message);
        message.error(`Error al procesar la venta: ${error.message}`);
      }
    }
  };

  const showSaleDetails = (sale) => {
    setSelectedSale(sale);
    setIsDetailsModalVisible(true);
  };

  const columns = [
    {
      title: 'Cliente',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      sorter: (a, b) => a.customer.name.localeCompare(b.customer.name),
      sortDirections: ['ascend', 'descend']
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      sortDirections: ['ascend', 'descend']
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `$${amount.toFixed(2)}`,
      sorter: (a, b) => a.total_amount - b.total_amount,
      sortDirections: ['ascend', 'descend']
    },
    {
      title: 'Usuario',
      dataIndex: ['user', 'username'],
      key: 'user',
      sorter: (a, b) => a.user.username.localeCompare(b.user.username),
      sortDirections: ['ascend', 'descend']
    },
    {
      title: 'Estado de Pago',
      dataIndex: 'paid',
      key: 'paid',
      render: (paid) => (
        <Badge status={paid ? "success" : "warning"} text={paid ? "Pagado" : "Pendiente"} />
      ),
      sorter: (a, b) => a.paid - b.paid,
      sortDirections: ['ascend', 'descend']
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => showSaleDetails(record)}
          >
            
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Ventas</h2>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          Nueva Venta
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Buscar por ID, cliente o monto..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <RangePicker
            placeholder={['Fecha inicio', 'Fecha fin']}
            value={dateRange}
            onChange={setDateRange}
            allowClear
            format="DD/MM/YYYY"
          />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredSales}
        rowKey="id"
        onRow={(record) => ({
          style: {
            backgroundColor: record.id === highlightedSaleId ? '#f6ffed' : 'inherit',
            transition: 'background-color 0.5s ease-in-out'
          }
        })}
      />

      {/* Modal de detalles de venta */}
      <Modal
        title="Detalles de la Venta"
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Cerrar
          </Button>
        ]}
        width={800}
      >
        {selectedSale && (
          <div>
            <Descriptions title="Información de la Venta" bordered>
              <Descriptions.Item label="ID">{selectedSale.id}</Descriptions.Item>
              <Descriptions.Item label="Cliente">{selectedSale.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="Procesado por">{selectedSale.user?.username}</Descriptions.Item>
              <Descriptions.Item label="Fecha">{
                (() => {
                  const date = new Date(selectedSale.created_at);
                  // Ajustar a GMT-3
                  date.setHours(date.getHours() - date.getTimezoneOffset() / 60 - 3);
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  const hours = String(date.getHours()).padStart(2, '0');
                  const minutes = String(date.getMinutes()).padStart(2, '0');
                  return `${day}/${month}/${year} ${hours}:${minutes}`;
                })()
              }</Descriptions.Item>
              <Descriptions.Item label="Total">${selectedSale.total_amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Estado de Pago">
                <Badge status={selectedSale.paid ? "success" : "warning"} text={selectedSale.paid ? "Pagado" : "Pendiente"} />
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h3>Productos</h3>
              <Table
                dataSource={selectedSale.items}
                rowKey="id"
                pagination={false}
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
                    render: (value) => `$${value.toFixed(2)}`,
                  },
                  {
                    title: 'Subtotal',
                    dataIndex: 'subtotal',
                    key: 'subtotal',
                    render: (value) => `$${value.toFixed(2)}`,
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de nueva/editar venta */}
      <Modal
        title={isEditing ? "Editar Venta" : "Nueva Venta"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setIsEditing(false);
          setSelectedSale(null);
        }}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={selectedSale}
        >
          <Form.Item
            name="customer_id"
            label="Cliente"
            rules={[{ required: true, message: 'Por favor seleccione un cliente' }]}
          >
            <Select
              ref={customerSelectRef}
              placeholder="Seleccione un cliente"
              showSearch
              optionFilterProp="children"
            >
              {customers.map(customer => (
                <Select.Option key={customer.id} value={customer.id}>
                  {customer.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

         

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {saleItems.map((item, index) => {
                  const selectedProduct = items.find(p => p.id === item.item_id);
                  return (
                    <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <AutoComplete
                        ref={ref => autoCompleteRefs.current[index] = ref}
                        style={{ width: 300 }}
                        placeholder="Buscar producto..."
                        value={item.item_name}
                        options={items
                          .filter(product => product.stock > 0)
                          .map(product => ({
                            value: product.name,
                            label: (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{product.name}</span>
                                <span style={{ color: '#888' }}>
                                  ${product.price} (Stock: {product.stock})
                                </span>
                              </div>
                            ),
                            product: product
                          }))}
                        onSelect={(value, option) => {
                          const selectedProduct = option.product;
                          if (selectedProduct) {
                            updateSaleItem(index, 'item_id', selectedProduct.id);
                          }
                        }}
                        onChange={(value) => {
                          if (!item.item_id) {
                            updateSaleItem(index, 'item_name', value);
                          }
                        }}
                        filterOption={(inputValue, option) => {
                          const productName = option.value.toLowerCase();
                          const searchTerm = inputValue.toLowerCase();
                          return productName.includes(searchTerm);
                        }}
                        notFoundContent="No se encontraron productos"
                        allowClear
                        onClear={() => {
                          updateSaleItem(index, 'item_id', null);
                          updateSaleItem(index, 'item_name', '');
                          updateSaleItem(index, 'unit_price', 0);
                          updateSaleItem(index, 'quantity', 1);
                          updateSaleItem(index, 'max_quantity', 0);
                        }}
                      />
                      <InputNumber
                        min={1}
                        max={item.max_quantity}
                        value={item.quantity || 1}
                        onChange={(value) => {
                          const maxQuantity = item.max_quantity || 0;
                          if (isNaN(value)) {
                            message.error('Por favor ingrese un valor numérico válido');
                            updateSaleItem(index, 'quantity', 1);
                          } else if (value > maxQuantity) {
                            message.warning(`Stock disponible: ${maxQuantity} unidades`);
                            updateSaleItem(index, 'quantity', maxQuantity);
                          } else {
                            updateSaleItem(index, 'quantity', value);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (!/^\d$/.test(e.key)) {
                            e.preventDefault();
                            message.error('Por favor ingrese solo números');
                          } else {
                            const value = Number(e.target.value + e.key);
                            const maxQuantity = item.max_quantity || 0;
                            if (value > maxQuantity) {
                              e.preventDefault();
                              message.warning(`Stock disponible: ${maxQuantity} unidades`);
                            }
                          }
                        }}
                        placeholder="Cantidad"
                        disabled={!item.item_id}
                        style={{ width: 100 }}
                        controls={true}
                      />
                      <InputNumber
                        min={0}
                        step={0.01}
                        value={item.unit_price}
                        onChange={(value) => updateSaleItem(index, 'unit_price', value)}
                        placeholder="Precio unitario"
                        prefix="$"
                        disabled={!item.item_id}
                        style={{ width: 120 }}
                      />
                      {item.item_id && selectedProduct ? (
                        <span style={{ minWidth: '150px' }}>
                          Stock disponible: {selectedProduct.stock}
                        </span>
                      ) : null}
                      <span>Subtotal: ${(item.subtotal || 0).toFixed(2)}</span>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeSaleItem(index)}
                      />
                    </Space>
                  );
                })}

                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <Button type="dashed" onClick={addSaleItem} block icon={<PlusOutlined />}>
                    Agregar Producto
                  </Button>
                </div>

                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <strong>Total: ${calculateTotal().toFixed(2)}</strong>
                </div>
              </>
            )}
          </Form.List>
          <Form.Item
            name="paid"
            label="Estado de Pago"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="Pagado" unCheckedChildren="Pendiente" />
          </Form.Item>
        </Form>
        
      </Modal>
    </div>
  );
};

export default SaleList; 