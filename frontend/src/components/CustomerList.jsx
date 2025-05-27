import React, { useState, useEffect, useRef } from "react";
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../services/api";

const PAGE_SIZE = 10;

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const nameInputRef = useRef(null);

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check if Ctrl + N is pressed
      if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        handleAdd();
        message.info('Creando nuevo cliente...');
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const fetchCustomers = async (page = 1, pageSize = PAGE_SIZE, search = '') => {
    try {
      setLoading(true);
      const skip = (page - 1) * pageSize;
      const limit = pageSize;
      // Suponiendo que getCustomers puede aceptar skip y limit
      const response = await getCustomers({ skip, limit, search });
      // Si el backend retorna { data: [...], total: n }
      if (response && Array.isArray(response.data)) {
        setCustomers(response.data);
        setTotal(response.total || response.data.length);
      } else if (Array.isArray(response)) {
        setCustomers(response);
        setTotal(response.length);
      } else {
        setCustomers([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error("Error al cargar los clientes");
      setCustomers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(currentPage, pageSize, searchText);
    // eslint-disable-next-line
  }, [currentPage, pageSize]);

  useEffect(() => {
    // Cuando cambia el texto de búsqueda, reiniciar a la primera página
    setCurrentPage(1);
    fetchCustomers(1, pageSize, searchText);
    // eslint-disable-next-line
  }, [searchText]);

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
    // Focus on name input after modal is visible
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 100);
  };

  const handleEdit = (record) => {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id);
      message.success("Cliente eliminado exitosamente");
      fetchCustomers(currentPage, pageSize, searchText);
    } catch (error) {
      console.error('Error deleting customer:', error);
      message.error("Error al eliminar el cliente");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, values);
        message.success("Cliente actualizado exitosamente");
      } else {
        await createCustomer(values);
        message.success("Cliente creado exitosamente");
      }
      setModalVisible(false);
      fetchCustomers(currentPage, pageSize, searchText);
    } catch (error) {
      console.error('Error saving customer:', error);
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error("Error al guardar el cliente");
      }
    }
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Teléfono",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Dirección",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Eliminar cliente"
            description="¿Está seguro de que desea eliminar este cliente?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Nuevo Cliente
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={customers}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showTotal: (total) => `Total ${total} clientes`,
        }}
      />
      <Modal
        title={editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nombre"
            rules={[{ required: true, message: "Por favor ingrese el nombre del cliente" }]}
          >
            <Input ref={nameInputRef} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Por favor ingrese el email del cliente" },
              { type: "email", message: "Por favor ingrese un email válido" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Teléfono"
            rules={[{ required: true, message: "Por favor ingrese el teléfono del cliente" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Dirección"
            rules={[{ required: true, message: "Por favor ingrese la dirección del cliente" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerList; 