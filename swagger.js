// ─────────────────────────────────────────────────────────────────────────────
// swagger.js  —  SWAGGER / OPENAPI DOCUMENTATION SETUP
//
// Swagger is a tool that automatically generates an interactive "try it out"
// web page for your API.  You can test every endpoint directly in the browser
// without needing Postman or curl.
//
// We use two packages together:
//   • swagger-jsdoc   — reads special /** @swagger */ comments from route files
//                       and converts them into a JSON description (OpenAPI spec)
//   • swagger-ui-express — serves that JSON as a beautiful HTML page
//
// The HTML page is available at:  http://localhost:5003/api-docs
// ─────────────────────────────────────────────────────────────────────────────

// swagger-jsdoc scans our JS files for @swagger comments and builds the spec
const swaggerJsdoc = require('swagger-jsdoc');

// Configuration object that tells swagger-jsdoc what to generate
const options = {
  definition: {
    openapi: '3.0.0', // We follow the OpenAPI 3.0 standard
    info: {
      title: 'Order Service API',
      version: '1.0.0',
      description:
        'Food Delivery System — Order Service. Manages order creation, lifecycle, status transitions, and history.',
    },
    servers: [
      {
        // This tells Swagger UI which base URL to use when sending test requests
        url: 'http://localhost:5003',
        description: 'Development server',
      },
    ],
  },
  // Tell swagger-jsdoc WHERE to look for @swagger JSDoc comments
  // The glob pattern below matches every .js file inside src/routes/
  apis: ['./src/routes/*.js'],
};

// Build the final OpenAPI specification object from the options above
const swaggerSpec = swaggerJsdoc(options);

// Export so that app.js can serve it via swagger-ui-express
module.exports = swaggerSpec;
