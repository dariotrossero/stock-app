import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    token: string | null;
    setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    const fetchUserData = async (authToken: string) => {
        try {
            console.log('Fetching user data with token:', authToken);
            const response = await fetch('http://localhost:8000/users/me', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            console.log('User data response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('User data received:', data);
                setUser(data);
            } else {
                console.error('Error response from server:', response.status);
                setToken(null);
                setUser(null);
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            console.log('Found stored token, fetching user data...');
            fetchUserData(storedToken);
        } else {
            console.log('No stored token found');
            setUser(null);
        }
    }, []);

    const handleSetToken = (newToken: string | null) => {
        console.log('Setting new token:', newToken);
        if (newToken) {
            localStorage.setItem('token', newToken);
            setToken(newToken);
            fetchUserData(newToken);
        } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        }
    };

    const handleSetUser = (newUser: User | null) => {
        console.log('Setting new user:', newUser);
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            setUser: handleSetUser, 
            token, 
            setToken: handleSetToken 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 