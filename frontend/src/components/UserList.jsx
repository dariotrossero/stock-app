import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);
  const usernameInputRef = useRef(null);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'n') {
        event.preventDefault(); // Prevenir el comportamiento por defecto del navegador
        handleAdd();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []); // El efecto solo se ejecuta una vez al montar el componente

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      message.error('Error al cargar los usuarios');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      is_active: user.is_active,
      is_admin: user.is_admin
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}/`);
      message.success('Usuario eliminado exitosamente');
      fetchUsers();
    } catch (error) {
      message.error('Error al eliminar el usuario');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        await api.put(`/users/${editingUser.id}/`, values);
        message.success('Usuario actualizado exitosamente');
      } else {
        await api.post('/users/', values);
        message.success('Usuario creado exitosamente');
      }
      
      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('Error al guardar el usuario');
    }
  };

  useEffect(() => {
    if (isModalVisible && !editingUser) {
      setTimeout(() => {
        usernameInputRef.current?.focus();
      }, 100);
    }
  }, [isModalVisible, editingUser]);

  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (is_active) => is_active ? 'Activo' : 'Inactivo',
    },
    {
      title: 'Rol',
      dataIndex: 'is_admin',
      key: 'is_admin',
      render: (is_admin) => is_admin ? 'Administrador' : 'Usuario',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Editar
          </Button>
          {!record.is_admin && (
            <Popconfirm
              title="Eliminar usuario"
              description="¿Está seguro de que desea eliminar este usuario?"
              onConfirm={() => handleDelete(record.id)}
              okText="Sí"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger>
                Eliminar
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />}>
          Nuevo Usuario
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
      />

      <Modal
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Usuario"
            rules={[{ required: true, message: 'Por favor ingrese el nombre de usuario' }]}
          >
            <Input ref={usernameInputRef} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Por favor ingrese un email válido' }
            ]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Contraseña"
              rules={[{ required: true, message: 'Por favor ingrese la contraseña' }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="is_active"
            label="Estado"
            rules={[{ required: true, message: 'Por favor seleccione el estado' }]}
          >
            <Select>
              <Select.Option value={true}>Activo</Select.Option>
              <Select.Option value={false}>Inactivo</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="is_admin"
            label="Rol"
            rules={[{ required: true, message: 'Por favor seleccione el rol' }]}
          >
            <Select>
              <Select.Option value={true}>Administrador</Select.Option>
              <Select.Option value={false}>Usuario</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const styles = `
  .custom-form {
    padding: 16px;
  }
  .form-group {
    margin-bottom: 16px;
  }
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }
  .ant-input {
    width: 100%;
    padding: 4px 11px;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
    transition: all 0.3s;
  }
  .ant-input:hover {
    border-color: #40a9ff;
  }
  .ant-input:focus {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    outline: none;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default UserList; 