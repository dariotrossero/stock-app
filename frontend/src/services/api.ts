import axios from 'axios';

// Type definitions
export type Stock = {
    id: number;
    symbol: string;
    company_name: string;
    current_price: number;
    created_at: string;
    updated_at: string | null;
};

export type User = {
    id: number;
    username: string;
    is_active: boolean;
};

export type Customer = {
    id: number;
    name: string;
    email: string;
    phone: string;
};

export type LoginResponse = {
    access_token: string;
    token_type: string;
};

export type LoginCredentials = {
    username: string;
    password: string;
};

export type StockUpdate = {
    id: number;
    item_id: number;
    quantity: number;
    created_at: string;
};

export type Item = {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    created_at: string;
    updated_at: string | null;
};

export type CustomerQueryParams = {
    skip?: number;
    limit?: number;
    search?: string;
};

const API_URL = 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('Current token:', token); // Debug log
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Request headers:', config.headers); // Debug log
    } else {
        console.warn('No token found in localStorage'); // Debug log
    }
    return config;
});

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.log('Received 401 response, clearing token'); // Debug log
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    console.log('Sending login request with form data:', {
        username: credentials.username,
        password: '***' // Don't log the actual password
    });
    
    const response = await api.post<LoginResponse>('/token', formData.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    
    console.log('Login response received:', {
        status: response.status,
        token_type: response.data.token_type,
        has_token: !!response.data.access_token
    });
    
    return response.data;
};

export const getStocks = async (): Promise<Stock[]> => {
    const response = await api.get<Stock[]>('/stocks/');
    return response.data;
};

export const getStock = async (id: number): Promise<Stock> => {
    const response = await api.get<Stock>(`/stocks/${id}`);
    return response.data;
};

export const createStock = async (stock: Omit<Stock, 'id' | 'created_at' | 'updated_at'>): Promise<Stock> => {
    const response = await api.post<Stock>('/stocks/', stock);
    return response.data;
};

export const updateStock = async (id: number, stock: Omit<Stock, 'id' | 'created_at' | 'updated_at'>): Promise<Stock> => {
    const response = await api.put<Stock>(`/stocks/${id}`, stock);
    return response.data;
};

export const deleteStock = async (id: number): Promise<Stock> => {
    const response = await api.delete<Stock>(`/stocks/${id}`);
    return response.data;
};

export const getUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/');
    return response.data;
};

export const createUser = async (user: { username: string; password: string }): Promise<User> => {
    const response = await api.post<User>('/users/', user);
    return response.data;
};

export const deleteUser = async (id: number): Promise<User> => {
    const response = await api.delete<User>(`/users/${id}`);
    return response.data;
};

// Customer API functions
export const getCustomers = async (params?: CustomerQueryParams): Promise<Customer[]> => {
    const response = await api.get<Customer[]>('/customers/', { params });
    return response.data;
};

export const getCustomer = async (id: number): Promise<Customer> => {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
};

export const createCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const response = await api.post<Customer>('/customers/', customer);
    return response.data;
};

export const updateCustomer = async (id: number, customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const response = await api.put<Customer>(`/customers/${id}`, customer);
    return response.data;
};

export const deleteCustomer = async (id: number): Promise<Customer> => {
    const response = await api.delete<Customer>(`/customers/${id}`);
    return response.data;
};

export const getStockUpdates = async (): Promise<StockUpdate[]> => {
    const response = await api.get<StockUpdate[]>('/stock-updates/');
    return response.data;
};

export const createStockUpdate = async (stockUpdate: { item_id: number; quantity: number }): Promise<StockUpdate> => {
    const response = await api.post<StockUpdate>('/stock-updates/', stockUpdate);
    return response.data;
};

export const getItems = async (): Promise<Item[]> => {
    console.log('Fetching items from API...');
    try {
        const response = await api.get<Item[]>('/items/');
        console.log('Items API response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching items:', error);
        throw error;
    }
};

export const getItem = async (id: number): Promise<Item> => {
    const response = await api.get<Item>(`/items/${id}`);
    return response.data;
};

export const createItem = async (item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item> => {
    const response = await api.post<Item>('/items/', item);
    return response.data;
};

export const updateItem = async (id: number, item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item> => {
    const response = await api.put<Item>(`/items/${id}`, item);
    return response.data;
};

export const deleteItem = async (id: number): Promise<Item> => {
    const response = await api.delete<Item>(`/items/${id}`);
    return response.data;
}; 