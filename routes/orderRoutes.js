// ─────────────────────────────────────────────────────────────────────────────
// src/routes/orderRoutes.js  —  ROUTE DEFINITIONS + SWAGGER DOCUMENTATION
//
// What are Routes?
//   Routes map an HTTP method + URL path to a specific controller function.
//   Example:  router.post('/', createOrder)
//             → any POST to /api/orders calls the createOrder controller
//
// Express Router:
//   We use express.Router() to create a "mini app" with its own routes.
//   It is then mounted in app.js with:  app.use('/api/orders', orderRoutes)
//   This means all routes here are relative to /api/orders.
//
// Swagger JSDoc (@swagger comments):
//   Special block comments tagged with @swagger (inside slash-star-star blocks)
//   are read by swagger-jsdoc at startup to generate the interactive docs page
//   at http://localhost:5003/api-docs  — they are NOT regular code.
//
// IMPORTANT — Route ordering:
//   Express matches routes in the order they are registered.
//   Routes with literal path segments (/user/:userId) MUST come BEFORE
//   the generic /:id route, otherwise "user" would be treated as an id value.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router(); // Create a new isolated router instance

const {
  createOrder,
  getOrderById,
  getOrdersByUser,
  getOrdersByRestaurant,
  getOrdersByStatus,
  updateOrderStatus,
  cancelOrder,
  updateOrderItems,
  deleteOrder,
} = require('../controllers/orderController');

// ─── Swagger component definitions ───────────────────────────────────────────

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - itemId
 *         - name
 *         - quantity
 *         - price
 *       properties:
 *         itemId:
 *           type: string
 *           example: item-001
 *         name:
 *           type: string
 *           example: Margherita Pizza
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         price:
 *           type: number
 *           minimum: 0
 *           example: 12.99
 *         subtotal:
 *           type: number
 *           readOnly: true
 *           example: 25.98
 *
 *     DeliveryAddress:
 *       type: object
 *       required:
 *         - street
 *         - city
 *       properties:
 *         street:
 *           type: string
 *           example: 123 Main Street
 *         city:
 *           type: string
 *           example: New York
 *         latitude:
 *           type: number
 *           example: 40.7128
 *         longitude:
 *           type: number
 *           example: -74.006
 *
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 664a1c2f8e3f2a001e4b1234
 *         orderId:
 *           type: string
 *           example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *         userId:
 *           type: string
 *           example: user-123
 *         restaurantId:
 *           type: string
 *           example: rest-456
 *         restaurantName:
 *           type: string
 *           example: Pizza Palace
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, READY_FOR_PICKUP, PICKED_UP, DELIVERED, CANCELLED]
 *           example: PENDING
 *         orderItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         subtotal:
 *           type: number
 *           example: 25.98
 *         deliveryFee:
 *           type: number
 *           example: 2.99
 *         tax:
 *           type: number
 *           example: 2.60
 *         totalAmount:
 *           type: number
 *           example: 31.57
 *         deliveryAddress:
 *           $ref: '#/components/schemas/DeliveryAddress'
 *         specialInstructions:
 *           type: string
 *           example: No onions please
 *         paymentId:
 *           type: string
 *           example: pay-789
 *         estimatedDeliveryTime:
 *           type: string
 *           format: date-time
 *         confirmedAt:
 *           type: string
 *           format: date-time
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Order not found
 */

// ─── POST /api/orders ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - restaurantId
 *               - orderItems
 *               - deliveryAddress
 *             properties:
 *               userId:
 *                 type: string
 *                 example: user-123
 *               restaurantId:
 *                 type: string
 *                 example: rest-456
 *               restaurantName:
 *                 type: string
 *                 example: Pizza Palace
 *               orderItems:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderItem'
 *                 example:
 *                   - itemId: item-001
 *                     name: Margherita Pizza
 *                     quantity: 2
 *                     price: 12.99
 *                   - itemId: item-002
 *                     name: Garlic Bread
 *                     quantity: 1
 *                     price: 3.99
 *               deliveryFee:
 *                 type: number
 *                 example: 2.99
 *               deliveryAddress:
 *                 $ref: '#/components/schemas/DeliveryAddress'
 *               specialInstructions:
 *                 type: string
 *                 example: No onions please
 *               paymentId:
 *                 type: string
 *                 example: pay-789
 *               estimatedDeliveryTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-30T20:00:00Z"
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.post('/', createOrder);

// ─── GET /api/orders/user/:userId ─────────────────────────────────────────────

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     summary: Get all orders for a specific user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: user-123
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId', getOrdersByUser);

// ─── GET /api/orders/restaurant/:restaurantId ────────────────────────────────

/**
 * @swagger
 * /api/orders/restaurant/{restaurantId}:
 *   get:
 *     summary: Get all orders for a specific restaurant
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         example: rest-456
 *     responses:
 *       200:
 *         description: List of restaurant orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 */
router.get('/restaurant/:restaurantId', getOrdersByRestaurant);

// ─── GET /api/orders/status/:status ──────────────────────────────────────────

/**
 * @swagger
 * /api/orders/status/{status}:
 *   get:
 *     summary: Get all orders by status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, READY_FOR_PICKUP, PICKED_UP, DELIVERED, CANCELLED]
 *         example: PENDING
 *     responses:
 *       200:
 *         description: List of orders with given status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid status value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.get('/status/:status', getOrdersByStatus);

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get a single order by its MongoDB ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId
 *         example: 664a1c2f8e3f2a001e4b1234
 *     responses:
 *       200:
 *         description: Order found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getOrderById);

// ─── PUT /api/orders/:id/status ───────────────────────────────────────────────

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update the status of an order
 *     description: |
 *       Enforces the following status transition rules:
 *       - PENDING → CONFIRMED | CANCELLED
 *       - CONFIRMED → PREPARING | CANCELLED
 *       - PREPARING → READY_FOR_PICKUP
 *       - READY_FOR_PICKUP → PICKED_UP
 *       - PICKED_UP → DELIVERED
 *       - DELIVERED / CANCELLED → (terminal, no further transitions)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 664a1c2f8e3f2a001e4b1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, PREPARING, READY_FOR_PICKUP, PICKED_UP, DELIVERED, CANCELLED]
 *                 example: CONFIRMED
 *     responses:
 *       200:
 *         description: Order status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid status or illegal transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/status', updateOrderStatus);

// ─── PUT /api/orders/:id/cancel ───────────────────────────────────────────────

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order
 *     description: Cancels the order. Only allowed when status is PENDING or CONFIRMED.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 664a1c2f8e3f2a001e4b1234
 *     responses:
 *       200:
 *         description: Order cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Cannot cancel order in its current status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/cancel', cancelOrder);

// ─── PUT /api/orders/:id/items ────────────────────────────────────────────────

/**
 * @swagger
 * /api/orders/{id}/items:
 *   put:
 *     summary: Update order items (only when PENDING)
 *     description: Replaces the order items array and recalculates subtotal, tax, and totalAmount.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 664a1c2f8e3f2a001e4b1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderItems
 *             properties:
 *               orderItems:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderItem'
 *                 example:
 *                   - itemId: item-001
 *                     name: Margherita Pizza
 *                     quantity: 3
 *                     price: 12.99
 *                   - itemId: item-003
 *                     name: Coke 500ml
 *                     quantity: 2
 *                     price: 1.99
 *     responses:
 *       200:
 *         description: Order items updated and totals recalculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Cannot update items or invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/items', updateOrderItems);

// ─── DELETE /api/orders/:id ───────────────────────────────────────────────────

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete an order (admin only)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 664a1c2f8e3f2a001e4b1234
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', deleteOrder);

module.exports = router;
