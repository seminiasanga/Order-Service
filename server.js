// ─────────────────────────────────────────────────────────────────────────────
// server.js  —  APPLICATION ENTRY POINT
// This is the first file Node.js runs when you execute: node server.js
// Its only job is to:
//   1. Load environment variables from the .env file
//   2. Connect to the MongoDB database
//   3. Start listening for HTTP requests on the configured port
// ─────────────────────────────────────────────────────────────────────────────

// dotenv reads the .env file and makes every key available as process.env.KEY
// Example: process.env.PORT will equal "5003" after this line runs
require('dotenv').config();

// Import the Express application we configured in src/app.js
const app = require('./src/app');

// Import the function that establishes the MongoDB connection
const connectDB = require('./src/config/db');

// Use the PORT value from .env; if it is missing, fall back to 5003
const PORT = process.env.PORT || 5003;

// async function so we can use 'await' to wait for the DB before starting HTTP
const startServer = async () => {
  // Wait until MongoDB is connected before accepting requests
  await connectDB();

  // Start the HTTP server — app.listen() tells Express to begin accepting connections
  app.listen(PORT, () => {
    console.log(`Order Service running on http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
};

// Call the function to kick everything off
startServer();
