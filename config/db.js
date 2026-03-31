// ─────────────────────────────────────────────────────────────────────────────
// src/config/db.js  —  DATABASE CONNECTION
//
// Mongoose is an ODM (Object Data Modelling) library for MongoDB.
// Instead of writing raw MongoDB queries, Mongoose lets us define Schemas
// (blueprints for our data) and then interact with the database using
// JavaScript objects.
//
// This file exports a single async function that:
//   1. Attempts to connect to MongoDB Atlas using the URI from .env
//   2. Logs success (including which host it connected to)
//   3. If connection fails, logs the error and exits the process
//      (there is no point running the API if there is no database)
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

// connectDB is exported and called once in server.js before the HTTP server starts
const connectDB = async () => {
  try {
    // mongoose.connect() returns a connection object we can inspect
    // process.env.MONGO_URI comes from the .env file loaded by dotenv in server.js
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Print the hostname of the server Mongoose connected to (useful for debugging)
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // If something went wrong (wrong password, network issue, etc.) print the reason
    console.error(`MongoDB connection error: ${error.message}`);

    // Exit the Node.js process with code 1 (non-zero = failure)
    // This prevents the API from running without a database
    process.exit(1);
  }
};

module.exports = connectDB;
