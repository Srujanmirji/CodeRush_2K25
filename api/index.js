const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// In-memory store (Reset on cold start)
const registeredUsers = new Set();

// API: Check status
app.post('/api/check-status', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const isRegistered = registeredUsers.has(email);
    res.json({ registered: isRegistered });
});

// API: Register
app.post('/api/register', (req, res) => {
    try {
        const registrationData = req.body;
        const userEmail = registrationData.leaderEmail;

        if (!userEmail) return res.status(400).json({ success: false, message: 'Leader Email required' });
        if (registeredUsers.has(userEmail)) return res.status(400).json({ success: false, message: 'Already registered.' });

        setTimeout(() => {
            registeredUsers.add(userEmail);
            res.json({
                success: true,
                message: 'Registration data received',
                team_id: `HTF-${Math.floor(1000 + Math.random() * 9000)}`
            });
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post('/api/create-order', async (req, res) => {
    try {
        const options = {
            amount: 10000,
            currency: "INR",
            receipt: "order_rcptid_" + Date.now(),
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).send("Error creating order");
    }
});

app.post('/api/verify-payment', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            res.json({ success: true, message: "Payment verification successful" });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.get('/', (req, res) => {
    res.send('Backend is running');
});

// Export the app for Vercel
module.exports = app;
