
/**
 * BACKEND SERVER EXAMPLE (Node.js + Express)
 * 
 * To run this:
 * 1. npm init -y
 * 2. npm install express cors dotenv multer
 * 3. node server.js
 */

const express = require('express');
const cors = require('cors');
// const multer = require('multer'); // Use multer for real file uploads
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images if sent via JSON
app.use(cors());

// Configure Multer (For real file handling)
// const upload = multer({ dest: 'uploads/' });

// In-memory store for registered emails (Note: This resets on server restart)
const registeredUsers = new Set();

// API: Check if user is already registered
app.post('/api/check-status', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const isRegistered = registeredUsers.has(email);
  res.json({ registered: isRegistered });
});

// API: Register Team (Handling form data + screenshot)
app.post('/api/register', (req, res) => {
  try {
    const registrationData = req.body;
    const userEmail = registrationData.leaderEmail; // Or passed separately as 'userEmail' from auth context

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Leader Email required' });
    }

    // Check if checks passed (Double check server-side)
    if (registeredUsers.has(userEmail)) {
      return res.status(400).json({ success: false, message: 'This email is already registered.' });
    }

    console.log("Received Registration Data:", registrationData.teamName);

    // In a real application:
    // 1. Save data to MongoDB/PostgreSQL
    // 2. Upload the screenshot image to Cloudinary/S3
    // 3. Send confirmation email

    // Simulating database save delay
    setTimeout(() => {
      // Mark user as registered
      registeredUsers.add(userEmail);

      res.json({
        success: true,
        message: 'Registration data received successfully',
        team_id: `HTF-${Math.floor(1000 + Math.random() * 9000)}`
      });
    }, 1500);

  } catch (error) {
    console.error('Error registering:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Razorpay Integration
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order endpoint
app.post('/create-order', async (req, res) => {
  try {
    const options = {
      amount: 10000, // amount in the smallest currency unit (Rs. 100)
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

// Verify Payment endpoint
app.post('/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is valid
      // You can save payment details and user registration here
      // For now, we just return success
      res.json({ success: true, message: "Payment verification successful" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }

  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});