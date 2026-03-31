# 🍔 Order Service — Food Delivery System

A production-ready **Node.js microservice** that manages the full lifecycle of customer orders in a Food Delivery System.  
Built with an **MVC architecture** and connected to **MongoDB Atlas**.

---

## 📋 Table of Contents

1. [What This Service Does](#what-this-service-does)
2. [Tech Stack](#tech-stack)
3. [Why This Tech Stack?](#why-this-tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Port Details](#port-details)
8. [API Endpoints](#api-endpoints)
9. [Order Status Flow](#order-status-flow)
10. [HTTP Status Codes Used](#http-status-codes-used)
11. [Business Logic Rules](#business-logic-rules)
12. [Data Models](#data-models)
13. [Swagger UI (Interactive Docs)](#swagger-ui-interactive-docs)
14. [Architecture Overview (MVC)](#architecture-overview-mvc)
15. [Error Handling](#error-handling)

---

## What This Service Does

The Order Service is responsible for:

| Responsibility | Description |
|---|---|
| **Order Creation** | Accepts order data, calculates totals, saves to MongoDB |
| **Order Retrieval** | Fetch orders by ID, user, restaurant, or status |
| **Lifecycle Management** | Enforces valid status transitions (PENDING → DELIVERED) |
| **Status Tracking** | Every status change is recorded in a separate audit history collection |
| **Order Editing** | Customers can update items while the order is still PENDING |
| **Cancellation** | Orders can be cancelled when PENDING or CONFIRMED |
| **Deletion** | Admin endpoint to permanently remove an order |

---

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | ^4.19 | HTTP web framework |
| **MongoDB Atlas** | Cloud | Database |
| **Mongoose** | ^8.3 | ODM — defines schemas, validates data, queries MongoDB |
| **swagger-jsdoc** | ^6.2 | Reads `@swagger` comments and generates OpenAPI spec |
| **swagger-ui-express** | ^5.0 | Serves the interactive documentation HTML page |
| **dotenv** | ^16.4 | Loads `.env` file variables into `process.env` |
| **uuid** | ^9.0 | Generates universally unique order IDs (UUID v4) |
| **nodemon** | ^3.1 | Dev tool — auto-restarts server on file changes |

---

## Why This Tech Stack?

### Node.js + Express.js
- **Non-blocking I/O** — handles many concurrent requests efficiently (perfect for order systems with high traffic)
- Express is minimal and un-opinionated, making it easy to structure the code exactly how you want
- Huge ecosystem — every library you need exists as an npm package

### MongoDB + Mongoose
- **Document model** fits order data perfectly — orders naturally look like JSON objects with nested arrays (orderItems) and nested objects (deliveryAddress)
- **Schema-less** at the DB level but **Mongoose adds schema validation** in the application layer — best of both worlds
- Atlas provides managed cloud hosting, automatic backups, and replica sets with zero configuration
- `timestamps: true` in the schema automatically adds `createdAt` and `updatedAt` — no manual date management

### Swagger (swagger-jsdoc + swagger-ui-express)
- Documentation lives **next to the code** (as JSDoc comments in route files) — it cannot go stale
- Swagger UI provides an interactive playground where testers can call every endpoint directly in the browser
- Uses the industry-standard **OpenAPI 3.0** format which integrates with tools like Postman, API gateways, and code generators

### dotenv
- Separates **code** from **configuration** — the same codebase works in development, staging, and production just by swapping the `.env` file
- Prevents accidental exposure of secrets (database passwords) in source code

### UUID
- MongoDB's native `_id` (ObjectId) is only unique _within MongoDB_
- UUID v4 generates a globally unique string ID that can be shared across services and databases
- Easier to reference in URLs than a 24-character hex ObjectId

---

## Project Structure

```
order-service/
│
├── server.js                      ← Entry point. Starts DB + HTTP server
├── swagger.js                     ← Builds the OpenAPI specification object
├── package.json                   ← Dependencies and npm scripts
├── .env                           ← Secret config values (never commit to Git)
│
└── src/
    ├── app.js                     ← Express app setup (middleware, routes, error handler)
    │
    ├── config/
    │   └── db.js                  ← MongoDB connection logic
    │
    ├── models/
    │   ├── Order.js               ← Mongoose schema for the "orders" collection
    │   └── OrderStatusHistory.js  ← Mongoose schema for the "order_status_history" collection
    │
    ├── controllers/
    │   └── orderController.js     ← HTTP handlers (read req, call service, send res)
    │
    ├── services/
    │   └── orderService.js        ← All business logic (calculations, validations, DB queries)
    │
    ├── routes/
    │   └── orderRoutes.js         ← Maps URLs to controller functions + Swagger docs
    │
    └── middleware/
        └── errorHandler.js        ← Catches all errors and formats a consistent JSON response
```

> **MVC pattern in this structure:**
> - **Model** → `src/models/`
> - **View** → JSON responses (this is an API, not a web app)
> - **Controller** → `src/controllers/` + `src/routes/`
> - **Service** → `src/services/` (extends MVC with a business logic layer)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- Internet connection (MongoDB Atlas is cloud-hosted)

### Step 1 — Install Dependencies

Open a terminal in the project folder and run:

```bash
npm install
```

This reads `package.json` and downloads all required packages into `node_modules/`.

### Step 2 — Configure Environment

The `.env` file is already set up with the MongoDB Atlas connection.  
You do **not** need a local MongoDB installation.

```env
PORT=5003
MONGO_URI=mongodb://kulindupabasara16:...@cluster0.oov7r.mongodb.net/order-service?...
NODE_ENV=development
```

### Step 3 — Start the Server

```bash
node server.js
```

You should see:

```
MongoDB connected: cluster0-shard-00-01.oov7r.mongodb.net
Order Service running on http://localhost:5003
Swagger docs available at http://localhost:5003/api-docs
```

### Step 4 — Test with Swagger UI

Open your browser and go to:

```
http://localhost:5003/api-docs
```

Click any endpoint → click **"Try it out"** → fill in the fields → click **"Execute"**.

---

### Development Mode (auto-restart)

```bash
npm run dev
```

`nodemon` watches your files and automatically restarts the server whenever you save a change.

---

## Environment Variables

| Variable | Example Value | Description |
|---|---|---|
| `PORT` | `5003` | The port the HTTP server listens on |
| `MONGO_URI` | `mongodb://user:pass@host/db?...` | Full MongoDB Atlas connection string |
| `NODE_ENV` | `development` | Enables stack traces in error responses when set to `development` |

> ⚠️ Never commit your `.env` file to a public Git repository. Add `.env` to your `.gitignore`.

---

## Port Details

| Port | Service | URL |
|---|---|---|
| **5003** | Order Service API | `http://localhost:5003` |
| **5003** | Swagger UI | `http://localhost:5003/api-docs` |
| **5003** | Health Check | `http://localhost:5003/health` |

---

## API Endpoints

Base URL: `http://localhost:5003/api/orders`

| # | Method | Path | Description | Success Code |
|---|---|---|---|---|
| 1 | `POST` | `/api/orders` | Create a new order | `201 Created` |
| 2 | `GET` | `/api/orders/:id` | Get a single order by MongoDB ID | `200 OK` |
| 3 | `GET` | `/api/orders/user/:userId` | Get all orders for a user | `200 OK` |
| 4 | `GET` | `/api/orders/restaurant/:restaurantId` | Get all orders for a restaurant | `200 OK` |
| 5 | `GET` | `/api/orders/status/:status` | Get all orders with a specific status | `200 OK` |
| 6 | `PUT` | `/api/orders/:id/status` | Update order status (enforced transitions) | `200 OK` |
| 7 | `PUT` | `/api/orders/:id/cancel` | Cancel an order | `200 OK` |
| 8 | `PUT` | `/api/orders/:id/items` | Update order items + recalculate totals | `200 OK` |
| 9 | `DELETE` | `/api/orders/:id` | Delete an order (admin) | `200 OK` |

---

### Sample Request — Create Order

`POST /api/orders`

```json
{
  "userId": "user-123",
  "restaurantId": "rest-456",
  "restaurantName": "Pizza Palace",
  "orderItems": [
    {
      "itemId": "item-001",
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 12.99
    },
    {
      "itemId": "item-002",
      "name": "Garlic Bread",
      "quantity": 1,
      "price": 3.99
    }
  ],
  "deliveryFee": 2.99,
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.006
  },
  "specialInstructions": "No onions please",
  "paymentId": "pay-789",
  "estimatedDeliveryTime": "2026-03-30T20:00:00Z"
}
```

**Calculated response values:**
```
subtotal    = (2 × 12.99) + (1 × 3.99) = 29.97
tax         = 29.97 × 10% = 3.00
totalAmount = 29.97 + 3.00 + 2.99 = 35.96
```

---

### Sample Request — Update Status

`PUT /api/orders/:id/status`

```json
{
  "status": "CONFIRMED"
}
```

---

### Sample Request — Update Items

`PUT /api/orders/:id/items`

```json
{
  "orderItems": [
    {
      "itemId": "item-001",
      "name": "Margherita Pizza",
      "quantity": 3,
      "price": 12.99
    }
  ]
}
```

---

## Order Status Flow

Every order begins as `PENDING` and moves through the following lifecycle:

```
PENDING
  │
  ├─── CANCELLED  (allowed from PENDING)
  │
  ▼
CONFIRMED
  │
  ├─── CANCELLED  (allowed from CONFIRMED)
  │
  ▼
PREPARING
  │
  ▼
READY_FOR_PICKUP
  │
  ▼
PICKED_UP
  │
  ▼
DELIVERED  ✓  (terminal — no further transitions)

CANCELLED  ✗  (terminal — no further transitions)
```

| Status | Meaning | Who sets it |
|---|---|---|
| `PENDING` | Order placed, awaiting restaurant confirmation | Auto (on creation) |
| `CONFIRMED` | Restaurant accepted the order | Restaurant / Admin |
| `PREPARING` | Kitchen is cooking | Restaurant |
| `READY_FOR_PICKUP` | Food is ready, waiting for rider | Restaurant |
| `PICKED_UP` | Rider collected the food | Delivery system |
| `DELIVERED` | Customer received the food | Delivery system |
| `CANCELLED` | Order was cancelled | Customer / Admin |

### Lifecycle Timestamps

| Event | Field Set |
|---|---|
| Status → `CONFIRMED` | `confirmedAt` is stamped |
| Status → `DELIVERED` | `deliveredAt` is stamped |

Every status change (regardless of which) creates a record in the `order_status_history` collection for auditing.

---

## HTTP Status Codes Used

| Code | Meaning | When returned |
|---|---|---|
| `200 OK` | Success | GET, PUT, DELETE succeeded |
| `201 Created` | Resource created | POST /api/orders succeeded |
| `400 Bad Request` | Client error | Missing fields, invalid status, illegal transition |
| `404 Not Found` | Resource not found | Order ID does not exist |
| `409 Conflict` | Duplicate value | Tried to insert a duplicate orderId |
| `500 Internal Server Error` | Server error | Unexpected crash |

---

## Business Logic Rules

1. **Auto-calculated totals**
   - `item.subtotal = item.quantity × item.price`
   - `order.subtotal = Σ item.subtotal`
   - `order.tax = order.subtotal × 10%`
   - `order.totalAmount = order.subtotal + order.tax + order.deliveryFee`

2. **Status transitions are strictly enforced** — invalid jumps return HTTP 400

3. **Cancellation guard** — only `PENDING` or `CONFIRMED` orders can be cancelled

4. **Item update guard** — items can only be modified when the order is `PENDING`

5. **Status history** — every status change writes to `order_status_history` (audit trail)

6. **UUID as orderId** — separate from MongoDB's `_id` for use across services

---

## Data Models

### Order (collection: `orders`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `orderId` | String | ✅ | UUID v4, unique |
| `userId` | String | ✅ | Customer ID |
| `restaurantId` | String | ✅ | Restaurant ID |
| `restaurantName` | String | ❌ | Display name |
| `status` | Enum | ✅ | Default: PENDING |
| `orderItems` | Array | ✅ | Min 1 item |
| `orderItems[].itemId` | String | ✅ | Menu item ID |
| `orderItems[].name` | String | ✅ | Display name |
| `orderItems[].quantity` | Number | ✅ | Min 1 |
| `orderItems[].price` | Number | ✅ | Per unit |
| `orderItems[].subtotal` | Number | — | Auto-calculated |
| `subtotal` | Number | ✅ | Auto-calculated |
| `deliveryFee` | Number | ❌ | Default 0 |
| `tax` | Number | ✅ | 10% of subtotal |
| `totalAmount` | Number | ✅ | Auto-calculated |
| `deliveryAddress.street` | String | ✅ | |
| `deliveryAddress.city` | String | ✅ | |
| `deliveryAddress.latitude` | Number | ❌ | GPS |
| `deliveryAddress.longitude` | Number | ❌ | GPS |
| `specialInstructions` | String | ❌ | Free text |
| `paymentId` | String | ❌ | From payment service |
| `estimatedDeliveryTime` | Date | ❌ | ETA |
| `confirmedAt` | Date | ❌ | Auto-set on CONFIRMED |
| `deliveredAt` | Date | ❌ | Auto-set on DELIVERED |
| `createdAt` | Date | — | Auto by Mongoose |
| `updatedAt` | Date | — | Auto by Mongoose |

### OrderStatusHistory (collection: `order_status_history`)

| Field | Type | Notes |
|---|---|---|
| `orderId` | String | References Order.orderId |
| `status` | String | The status at time of record |
| `changedAt` | Date | Defaults to current time |

---

## Swagger UI (Interactive Docs)

After starting the server, open:

```
http://localhost:5003/api-docs
```

The Swagger UI lets you:
- Browse all 9 endpoints with full descriptions
- See request/response schemas
- Click **"Try it out"** to send real HTTP requests
- View sample request bodies with example values

All documentation is written as `@swagger` JSDoc comments directly inside `src/routes/orderRoutes.js`.

---

## Architecture Overview (MVC)

```
HTTP Request
     │
     ▼
 src/routes/orderRoutes.js      ← Maps URL + method to a controller function
     │
     ▼
 src/controllers/orderController.js  ← Extracts data from req, calls service, sends res
     │
     ▼
 src/services/orderService.js   ← ALL business logic lives here
     │
     ▼
 src/models/Order.js            ← Mongoose schema + MongoDB collection
     │
     ▼
  MongoDB Atlas (Cloud)
```

**Centralized error flow:**
```
Any layer throws Error
        │
        ▼
  next(err) in controller
        │
        ▼
  src/middleware/errorHandler.js  ← Formats and sends consistent JSON error response
```

---

## Error Handling

All errors are handled centrally in `src/middleware/errorHandler.js`.

### Error response format

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

In `development` mode, the response also includes a `stack` property with the full stack trace to help with debugging.

### Handled error types

| Error Type | HTTP Code | Cause |
|---|---|---|
| Custom app error (e.g. "Order not found") | 404 | Logic in service throws `createError(404, ...)` |
| Validation failure | 400 | Missing required field or invalid enum value |
| Duplicate key | 409 | Trying to save a duplicate `orderId` |
| Mongoose CastError | 400 | Invalid MongoDB ObjectId in URL param |
| Illegal status transition | 400 | e.g. trying to go DELIVERED → PENDING |
| Unhandled exceptions | 500 | Unexpected server errors |
