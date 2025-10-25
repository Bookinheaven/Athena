import "./utils/loadEnv.js"
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Routers
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js"
// Database instance setup
import { connectDB } from "./configs/db.js"

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// SETUP for express instance and adding required in-built middleware (express.json() => JSON parser)
const app = express();
app.use(limiter);
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


// # Routings 
// app.get('/', (req, res) => {
//     res.send("hello")
// })

// Routing to auth for login and logout
// app.use("/api/auth", authRoutes);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'StudyTracker API is running!',
    timestamp: new Date().toISOString()
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  });
});
// 404 handler
// app.use('*', (req, res) => {
//     res.status(404).json({
//         success: false,
//         message: `Route ${req.originalUrl} not found`
//     });
// });


const PORT = process.env.PORT || 5000;
const startServer = async () => {
        // connecting database
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Athena Backend ready!`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};

startServer();