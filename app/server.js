const express = require('express');
const { Pool } = require('pg');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Online Food Ordering Platform is running'
    });
});

const PORT = process.env.APP_PORT || 3000;

const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'food_orders',
    user: process.env.DB_USER || 'fooduser',
    password: process.env.DB_PASSWORD || 'foodpassword'
});

async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            customer_name VARCHAR(100) NOT NULL,
            food_item VARCHAR(100) NOT NULL,
            quantity INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// Health endpoint
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        res.json({
            status: 'UP',
            database: 'CONNECTED'
        });
    } catch (error) {
        res.status(500).json({
            status: 'DOWN',
            database: 'DISCONNECTED'
        });
    }
});

// Create an order
app.post('/orders', async (req, res) => {
    try {
        const { customer_name, food_item, quantity } = req.body;

        if (!customer_name || !food_item || !quantity) {
            return res.status(400).json({
                error: 'customer_name, food_item and quantity are required'
            });
        }

        const result = await pool.query(
            `INSERT INTO orders (customer_name, food_item, quantity)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [customer_name, food_item, quantity]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to create order'
        });
    }
});

// Retrieve orders
app.get('/orders', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM orders ORDER BY id'
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to retrieve orders'
        });
    }
});

async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`Order API running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

startServer();