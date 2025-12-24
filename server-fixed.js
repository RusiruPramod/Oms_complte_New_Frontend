const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes (simplified)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple authentication
  if (email === 'admin@nirvaan.lk' && password === 'admin123') {
    res.json({
      success: true,
      token: 'test-jwt-token',
      user: {
        id: 1,
        fullName: 'Admin User',
        email: 'admin@nirvaan.lk',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Dashboard routes
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    total: 6,
    pending: 1,
    received: 1,
    issued: 1,
    courier: 3,
    today: 0,
    monthly: 6
  });
});

// Orders routes
app.get('/api/orders', (req, res) => {
  // Sample orders data - FIXED: unique IDs
  const orders = [
    {
      id: 1,
      order_id: 'ORD202401001',
      fullName: 'Kamal Perera',
      address: '123 Main Street, Colombo',
      mobile: '94701234567',
      product_id: 'PROD001',
      product: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      product_name: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      quantity: 2,
      status: 'pending',
      total_amount: 20000.00,
      createdAt: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      order_id: 'ORD202401002',
      fullName: 'Rusiru Pramod',
      address: '456 Galle Road, Colombo',
      mobile: '94701234568',
      product_id: 'PROD001',
      product: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      product_name: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      quantity: 3,
      status: 'received',
      total_amount: 30000.00,
      createdAt: '2024-01-02T10:00:00Z'
    },
    {
      id: 3,
      order_id: 'ORD202401003',
      fullName: 'Nimal Silva',
      address: '789 Kandy Road, Kandy',
      mobile: '94701234569',
      product_id: 'PROD001',
      product: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      product_name: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      quantity: 1,
      status: 'issued',
      total_amount: 10000.00,
      createdAt: '2024-01-03T10:00:00Z'
    },
    {
      id: 4,
      order_id: 'ORD202401004',
      fullName: 'Anil Fernando',
      address: '321 Beach Road, Galle',
      mobile: '94701234570',
      product_id: 'PROD001',
      product: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      product: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      quantity: 2,
      status: 'sended',
      total_amount: 20000.00,
      createdAt: '2024-01-04T10:00:00Z'
    }
  ];
  
  res.json({
    success: true,
    data: orders
  });
});

// Create new order
app.post('/api/orders', (req, res) => {
  const { fullName, address, mobile, product, quantity, status } = req.body;
  
  // Validate required fields
  if (!fullName || !address || !mobile || !product || !quantity) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Generate order ID
  const orderId = `ORD${Date.now()}`;
  
  // Calculate price based on product
  let unitPrice = 10000.00; // Default price
  let productName = 'NIRVAAN 5KG (100% PURE COCONUT OIL)';
  
  // Create order object
  const newOrder = {
    id: Date.now(),
    order_id: orderId,
    fullName,
    address,
    mobile,
    product_id: 'PROD001',
    product: productName,
    product_name: productName,
    quantity: parseInt(quantity),
    status: status || 'pending',
    total_amount: unitPrice * parseInt(quantity),
    createdAt: new Date().toISOString()
  };
  
  console.log('New order created:', newOrder);
  
  res.json({
    success: true,
    message: 'Order created successfully',
    data: newOrder
  });
});

// Create inquiry
app.post('/api/inquiries', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }
  
  const newInquiry = {
    id: Date.now(),
    message,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  
  console.log('New inquiry created:', newInquiry);
  
  res.json({
    success: true,
    message: 'Inquiry submitted successfully',
    data: newInquiry
  });
});

// Get all inquiries
app.get('/api/inquiries', (req, res) => {
  const inquiries = [
    {
      id: 1,
      message: 'මෙහි ඉතිරි තොරතුරු ලබාගන්න පුළුවන්ද?',
      createdAt: '2024-01-01T10:00:00Z',
      status: 'pending'
    }
  ];
  
  res.json({
    success: true,
    data: inquiries
  });
});

// Get single order by ID
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  
  // Sample orders data
  const orders = [
    {
      id: '1',
      order_id: 'ORD202401001',
      fullName: 'Kamal Perera',
      address: '123 Main Street, Colombo',
      mobile: '94701234567',
      product_id: 'PROD001',
      product: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      quantity: '2',
      status: 'pending',
      total_amount: 20000.00,
      createdAt: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      order_id: 'ORD202401002',
      fullName: 'Rusiru Pramod',
      address: '456 Galle Road, Colombo',
      mobile: '94701234568',
      product_id: 'PROD001',
      product: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      quantity: '3',
      status: 'received',
      total_amount: 30000.00,
      createdAt: '2024-01-02T10:00:00Z'
    },
    {
      id: '3',
      order_id: 'ORD202401003',
      fullName: 'Nimal Silva',
      address: '789 Kandy Road, Kandy',
      mobile: '94701234569',
      product_id: 'PROD001',
      product: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      quantity: '1',
      status: 'issued',
      total_amount: 10000.00,
      createdAt: '2024-01-03T10:00:00Z'
    },
    {
      id: '4',
      order_id: 'ORD202401004',
      fullName: 'Anil Fernando',
      address: '321 Beach Road, Galle',
      mobile: '94701234570',
      product_id: 'PROD001',
      product: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      quantity: '2',
      status: 'sended',
      total_amount: 20000.00,
      createdAt: '2024-01-04T10:00:00Z'
    }
  ];
  
  const order = orders.find(o => o.id === id);
  
  if (order) {
    res.json({
      success: true,
      data: order
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
});

// Update order status
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { id, status }
  });
});

// Products routes
app.get('/api/products', (req, res) => {
  // Sample products data - FIXED: unique IDs
  const products = [
    {
      id: 1,
      product_id: 'PROD001',
      name: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
      description: '100% Pure Coconut Oil, 5KG pack',
      price: 10000.00,
      status: 'available',
      category: 'Coconut Oil',
      image: '/images/oil.jpg'
    },
    {
      id: 2,
      product_id: 'PROD002',
      name: 'NIRVAAN 2.5KG (100% PURE COCONUT OIL)',
      description: '100% Pure Coconut Oil, 2.5KG pack',
      price: 5500.00,
      status: 'available',
      category: 'Coconut Oil',
      image: '/images/oil.jpg'
    },
    {
      id: 3,
      product_id: 'PROD003',
      name: 'NIRVAAN 1KG (100% PURE COCONUT OIL)',
      description: '100% Pure Coconut Oil, 1KG pack',
      price: 2500.00,
      status: 'available',
      category: 'Coconut Oil',
      image: '/images/oil.jpg'
    }
  ];
  
  res.json({
    success: true,
    data: products
  });
});

// Analytics routes
app.get('/api/analytics', (req, res) => {
  res.json({
    success: true,
    data: {
      totalRevenue: 75000,
      totalOrders: 6,
      statusData: [
        { name: "Pending", value: 1, color: "#f59e0b" },
        { name: "Received", value: 1, color: "#3b82f6" },
        { name: "Issued", value: 1, color: "#10b981" }
      ]
    }
  });
});

// Courier routes
app.get('/api/courier/orders', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 4,
        order_id: 'ORD202401004',
        fullName: 'Anil Silva',
        address: '321 Beach Road, Galle',
        mobile: '94701234570',
        product: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
        quantity: '2',
        status: 'sended',
        createdAt: '2024-01-04T10:00:00Z'
      },
      {
        id: 5,
        order_id: 'ORD202401005',
        fullName: 'Saman Kumara',
        address: '654 Temple Road, Anuradhapura',
        mobile: '94701234571',
        product: 'NIRVAAN 5KG (100% PURE COCONUT OIL)',
        quantity: '1',
        status: 'in-transit',
        createdAt: '2024-01-05T10:00:00Z'
      }
    ]
  });
});

// Update courier status
app.put('/api/courier/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  res.json({
    success: true,
    message: 'Status updated successfully',
    data: { id, status }
  });
});

// Create product
app.post('/api/products', (req, res) => {
  const product = req.body;
  
  res.json({
    success: true,
    message: 'Product created successfully',
    data: { id: Date.now(), ...product }
  });
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const product = req.body;
  
  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { id, ...product }
  });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Product deleted successfully',
    data: { id }
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Test login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   Email: admin@nirvaan.lk`);
  console.log(`   Password: admin123`);
});
