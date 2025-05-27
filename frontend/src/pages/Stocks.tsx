import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getStocks, createStock, updateStock, deleteStock } from '../services/api';
import type { Stock } from '../services/api';

export default function Stocks() {
    const navigate = useNavigate();
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingStock, setEditingStock] = useState<Stock | null>(null);
    const [formData, setFormData] = useState({
        symbol: '',
        company_name: '',
        current_price: '',
    });

    useEffect(() => {
        loadStocks();
    }, []);

    const loadStocks = async () => {
        try {
            const data = await getStocks();
            setStocks(data);
        } catch (err) {
            if (err.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleOpenDialog = (stock?: Stock) => {
        if (stock) {
            setEditingStock(stock);
            setFormData({
                symbol: stock.symbol,
                company_name: stock.company_name,
                current_price: stock.current_price.toString(),
            });
        } else {
            setEditingStock(null);
            setFormData({
                symbol: '',
                company_name: '',
                current_price: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingStock(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const stockData = {
                symbol: formData.symbol,
                company_name: formData.company_name,
                current_price: parseFloat(formData.current_price),
            };

            if (editingStock) {
                await updateStock(editingStock.id, stockData);
            } else {
                await createStock(stockData);
            }

            handleCloseDialog();
            loadStocks();
        } catch (err) {
            console.error('Error saving stock:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this stock?')) {
            try {
                await deleteStock(id);
                loadStocks();
            } catch (err) {
                console.error('Error deleting stock:', err);
            }
        }
    };

    return (
        <Container>
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h4" component="h1">
                        Stocks
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleOpenDialog()}
                    >
                        Add Stock
                    </Button>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Symbol</TableCell>
                                <TableCell>Company Name</TableCell>
                                <TableCell>Current Price</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stocks.map((stock) => (
                                <TableRow key={stock.id}>
                                    <TableCell>{stock.symbol}</TableCell>
                                    <TableCell>{stock.company_name}</TableCell>
                                    <TableCell>${stock.current_price.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            onClick={() => handleOpenDialog(stock)}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleDelete(stock.id)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>
                    {editingStock ? 'Edit Stock' : 'Add New Stock'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Symbol"
                            value={formData.symbol}
                            onChange={(e) =>
                                setFormData({ ...formData, symbol: e.target.value })
                            }
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Company Name"
                            value={formData.company_name}
                            onChange={(e) =>
                                setFormData({ ...formData, company_name: e.target.value })
                            }
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Current Price"
                            type="number"
                            value={formData.current_price}
                            onChange={(e) =>
                                setFormData({ ...formData, current_price: e.target.value })
                            }
                            margin="normal"
                            required
                            inputProps={{ step: '0.01' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editingStock ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
} 