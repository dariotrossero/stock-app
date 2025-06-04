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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { getItems, createItem, updateItem, deleteItem, getStockUpdates, createStockUpdate } from '../services/api';
import type { Item, StockUpdate } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Items() {
    const navigate = useNavigate();
    const { user } = useAuth();
    console.log('Items component - Current user:', user);
    console.log('Items component - Is admin?', user?.is_admin);
    const [items, setItems] = useState<Item[]>([]);
    const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openStockUpdateDialog, setOpenStockUpdateDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
    });
    const [stockUpdateData, setStockUpdateData] = useState({
        item_id: '',
        quantity: '',
    });

    useEffect(() => {
        console.log('Items component mounted');
        loadItems();
        loadStockUpdates();
    }, []);

    const loadItems = async () => {
        try {
            console.log('Loading items...');
            const data = await getItems();
            console.log('Items loaded successfully:', data);
            if (Array.isArray(data)) {
                setItems(data);
            } else {
                console.error('Received non-array data for items:', data);
                setItems([]);
            }
        } catch (err) {
            console.error('Error loading items:', err);
            if (err.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const loadStockUpdates = async () => {
        try {
            const data = await getStockUpdates();
            console.log('Stock updates loaded:', data);
            setStockUpdates(data);
        } catch (err) {
            console.error('Error loading stock updates:', err);
            if (err.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleOpenDialog = (item?: Item) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description,
                price: item.price.toString(),
                stock: item.stock.toString(),
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                stock: '',
            });
        }
        setOpenDialog(true);
    };

    const handleOpenStockUpdateDialog = () => {
        console.log('Opening stock update dialog. Current items:', items);
        if (Array.isArray(items) && items.length > 0) {
            const firstItem = items[0];
            console.log('Setting first item as default:', firstItem);
            setStockUpdateData({
                item_id: firstItem.id.toString(),
                quantity: '',
            });
        } else {
            console.log('No items available or items is not an array');
            setStockUpdateData({
                item_id: '',
                quantity: '',
            });
        }
        setOpenStockUpdateDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingItem(null);
    };

    const handleCloseStockUpdateDialog = () => {
        setOpenStockUpdateDialog(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const itemData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
            };

            if (editingItem) {
                await updateItem(editingItem.id, itemData);
            } else {
                await createItem(itemData);
            }

            handleCloseDialog();
            loadItems();
        } catch (err) {
            console.error('Error saving item:', err);
        }
    };

    const handleStockUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log('Submitting stock update with data:', stockUpdateData);
            await createStockUpdate({
                item_id: parseInt(stockUpdateData.item_id),
                quantity: parseInt(stockUpdateData.quantity),
            });

            handleCloseStockUpdateDialog();
            loadItems();
            loadStockUpdates();
        } catch (err) {
            console.error('Error updating stock:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
            try {
                await deleteItem(id);
                loadItems();
            } catch (err) {
                console.error('Error deleting item:', err);
            }
        }
    };

    const handleLoadDummyData = async () => {
        try {
            const response = await fetch('http://localhost:8000/load-dummy-data/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                alert('Datos de prueba cargados exitosamente');
                loadItems();
                loadStockUpdates();
            } else {
                const error = await response.json();
                alert(`Error: ${error.detail}`);
            }
        } catch (err) {
            console.error('Error loading dummy data:', err);
            alert('Error al cargar datos de prueba');
        }
    };

    return (
        <Container>
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h4" component="h1">
                        Productos
                    </Typography>
                    <Box>
                        {user && user.is_admin && (
                            <Button
                                variant="contained"
                                color="warning"
                                onClick={handleLoadDummyData}
                                sx={{ mr: 2 }}
                            >
                                Cargar Datos de Prueba
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleOpenDialog()}
                            sx={{ mr: 2 }}
                        >
                            Agregar Producto
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleOpenStockUpdateDialog}
                            startIcon={<AddIcon />}
                        >
                            Actualizar Stock
                        </Button>
                    </Box>
                </Box>

                <TableContainer component={Paper} sx={{ mb: 4 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Precio</TableCell>
                                <TableCell>Stock</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>${item.price.toFixed(2)}</TableCell>
                                    <TableCell>{item.stock}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            onClick={() => handleOpenDialog(item)}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleDelete(item.id)}
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

                <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                    Historial de Actualizaciones de Stock
                </Typography>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell>Cantidad</TableCell>
                                <TableCell>Fecha</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[...stockUpdates].sort((a, b) => {
                                const dateA = new Date(a.created_at).getTime();
                                const dateB = new Date(b.created_at).getTime();
                                return dateB - dateA;
                            }).map((update) => {
                                const item = items.find((i) => i.id === update.item_id);
                                return (
                                    <TableRow key={update.id}>
                                        <TableCell>{item?.name || 'Producto no encontrado'}</TableCell>
                                        <TableCell>{update.quantity > 0 ? `+${update.quantity}` : update.quantity}</TableCell>
                                        <TableCell>{new Date(update.created_at).toLocaleString()}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>
                    {editingItem ? 'Editar Producto' : 'Agregar Nuevo Producto'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Nombre"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Descripción"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            margin="normal"
                            required
                            multiline
                            rows={3}
                        />
                        <TextField
                            fullWidth
                            label="Precio"
                            type="number"
                            value={formData.price}
                            onChange={(e) =>
                                setFormData({ ...formData, price: e.target.value })
                            }
                            margin="normal"
                            required
                            inputProps={{ step: '0.01' }}
                        />
                        <TextField
                            fullWidth
                            label="Stock"
                            type="number"
                            value={formData.stock}
                            onChange={(e) =>
                                setFormData({ ...formData, stock: e.target.value })
                            }
                            margin="normal"
                            required
                            inputProps={{ step: '1' }}
                        />
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancelar</Button>
                            <Button type="submit" variant="contained" color="primary">
                                {editingItem ? 'Actualizar' : 'Crear'}
                            </Button>
                        </DialogActions>
                    </Box>
                </DialogContent>
            </Dialog>

            <Dialog open={openStockUpdateDialog} onClose={handleCloseStockUpdateDialog}>
                <DialogTitle>Actualizar Stock</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleStockUpdateSubmit} sx={{ mt: 2 }}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Producto</InputLabel>
                            <Select
                                value={stockUpdateData.item_id}
                                onChange={(e) => {
                                    console.log('Select onChange event:', e.target.value);
                                    setStockUpdateData({ ...stockUpdateData, item_id: e.target.value });
                                }}
                                required
                            >
                                {items && items.length > 0 ? (
                                    items.map((item) => (
                                        <MenuItem key={item.id} value={item.id.toString()}>
                                            {item.name} (Stock actual: {item.stock})
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>No hay productos disponibles</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Cantidad"
                            type="number"
                            value={stockUpdateData.quantity}
                            onChange={(e) =>
                                setStockUpdateData({ ...stockUpdateData, quantity: e.target.value })
                            }
                            margin="normal"
                            required
                            inputProps={{ step: '1' }}
                            helperText="Ingrese un número positivo para agregar stock o negativo para reducir"
                        />
                        <DialogActions>
                            <Button onClick={handleCloseStockUpdateDialog}>Cancelar</Button>
                            <Button type="submit" variant="contained" color="primary">
                                Actualizar
                            </Button>
                        </DialogActions>
                    </Box>
                </DialogContent>
            </Dialog>
        </Container>
    );
} 