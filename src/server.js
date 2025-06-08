//const express = require('express');
import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/db.js'; // Import the database connection function
import rateLimieter from './middleware/rateLimiter.js';

import transactionsRoute from './routes/transactionsRoute.js';
import job from './config/cron.js'; // Import the cron job
// Load environment variables from .env file
// Note: Ensure you have a .env file in the root directory with the PORT variable defined
dotenv.config();

const app = express();


if (process.env.NODE_ENV === 'production') job.start(); // Start the cron job if in production environment

//Middleware
app.use(rateLimieter); // Apply rate limiting middleware
app.use(express.json()); // Middleware to parse JSON bodies


app.use("/api/transactions",transactionsRoute);



const PORT=process.env.PORT|| 3000;

app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "Server is healthy" });
});

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});