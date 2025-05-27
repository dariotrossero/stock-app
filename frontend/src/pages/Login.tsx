import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
} from '@mui/material';
import { login } from '../services/api';
import type { LoginCredentials } from '../services/api';

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            console.log('Attempting login...');
            const response = await login({ username, password });
            console.log('Login successful:', response);
            localStorage.setItem('token', response.access_token);
            window.location.href = '/stocks';
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err.response?.data?.detail || 
                               (err.response?.data?.msg ? err.response.data.msg[0] : 'Failed to login. Please try again.');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100%',
                width: '100%',
                py: 4
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography 
                        component="h1" 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 600,
                            color: 'primary.main',
                            mb: 1
                        }}
                    >
                        Welcome Back
                    </Typography>
                    <Typography 
                        variant="body1" 
                        color="text.secondary"
                    >
                        Sign in to your account
                    </Typography>
                </Box>

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }}
                >
                    <TextField
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                            }
                        }}
                    />
                    <TextField
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                            }
                        }}
                    />
                    {error && (
                        <Typography 
                            color="error" 
                            sx={{ 
                                textAlign: 'center',
                                fontSize: '0.875rem'
                            }}
                        >
                            {error}
                        </Typography>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isLoading}
                        sx={{
                            mt: 2,
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 600,
                            borderRadius: 2
                        }}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
} 