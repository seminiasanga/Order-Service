// ─────────────────────────────────────────────────────────────────────────────
// src/app.js  —  EXPRESS APPLICATION CONFIGURATION
//
// This file creates and configures the Express "app" object.
// Think of app.js as the central hub where we:
//   • Tell Express how to parse incoming request data (JSON, form data)
//   • Register all route handlers (which URL does what)
//   • Mount the Swagger UI documentation page
//   • Attach the global error handler
//
// We intentionally keep server startup code (app.listen) OUT of this file
// so that the app can be imported and tested without actually starting a server.
// ─────────────────────────────────────────────────────────────────────────────

// Express is the web framework — it handles HTTP requests and responses
const express = require('express');

// swagger-ui-express serves our OpenAPI documentation as an interactive HTML page
const swaggerUi = require('swagger-ui-express');

// The compiled OpenAPI specification object built in swagger.js
const swaggerSpec = require('../swagger');

// All routes that start with /api/orders are defined here
const orderRoutes = require('./routes/orderRoutes');

// The centralized error-handling middleware (catches errors from all routes)
const errorHandler = require('./middleware/errorHandler');

// Create a new Express application instance
const app = express();

// ── Middleware (runs before every request reaches a route handler) ────────────

// Parse incoming requests with a JSON body (e.g. POST with { "userId": "123" })
// Without this, req.body would be undefined for JSON requests
app.use(express.json());

// Parse URL-encoded form data (e.g. HTML form submissions)
app.use(express.urlencoded({ extended: true }));

// ── Documentation route ───────────────────────────────────────────────────────

// Serve Swagger UI at /api-docs
// swaggerUi.serve  → sends the static CSS/JS files for the UI
// swaggerUi.setup  → injects our OpenAPI spec so the UI knows what to display
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Application routes ────────────────────────────────────────────────────────

// Mount all order-related routes under the /api/orders prefix
// Example: a route defined as POST / inside orderRoutes becomes POST /api/orders
app.use('/api/orders', orderRoutes);

// ── Health check ──────────────────────────────────────────────────────────────

// Simple endpoint used by load balancers / monitoring tools to verify the
// service is alive and responding
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'order-service' });
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────

// If no route above matched the request, return a 404 error
// This middleware has no path so it matches ANY method and URL
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Centralized error handler ─────────────────────────────────────────────────

// IMPORTANT: Error-handling middleware MUST be registered LAST
// It has 4 parameters (err, req, res, next) — Express identifies it by the 4th param
app.use(errorHandler);

// Export the configured app so server.js can call app.listen()
module.exports = app;
