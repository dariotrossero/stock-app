// Stock related types
export type Stock = {
    id: number;
    symbol: string;
    company_name: string;
    current_price: number;
    created_at: string;
    updated_at: string | null;
};

// User related types
export type User = {
    id: number;
    username: string;
    is_active: boolean;
};

// Authentication related types
export type LoginResponse = {
    access_token: string;
    token_type: string;
};

export type LoginCredentials = {
    username: string;
    password: string;
};