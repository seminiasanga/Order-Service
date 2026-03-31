// ─────────────────────────────────────────────────────────────────────────────
// src/controllers/orderController.js  —  HTTP REQUEST / RESPONSE HANDLERS
//
// What is a Controller?
//   In MVC (Model-View-Controller) architecture the Controller layer is the
//   bridge between the incoming HTTP request and the business logic (service).
//
// Rule of thumb for controllers:
//   1. Extract data from req (body, params, query)
//   2. Call the appropriate service function
//   3. Send back the HTTP response (status code + JSON)
//   4. If something goes wrong, forward the error to next() so the
//      centralized errorHandler middleware can format the response
//
// Controllers should NOT contain business logic (calculations, DB queries, etc.)
// That all lives in the service layer.
// ─────────────────────────────────────────────────────────────────────────────

const orderService = require('../services/orderService');

// ── POST /api/orders ──────────────────────────────────────────────────────────
// Creates a brand-new order.
// req.body should contain: userId, restaurantId, orderItems, deliveryAddress, …
const createOrder = async (req, res, next) => {
  try {
    // Delegate to the service; pass the entire request body
    const order = await orderService.createOrder(req.body);
    // 201 Created — resource was successfully created
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    // next(err) hands the error to errorHandler in app.js
    next(err);
  }
};

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
// Retrieves a single order by its MongoDB _id (e.g. 664a1c2f8e3f2a001e4b1234).
// req.params.id is the dynamic segment from the URL.
const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/orders/user/:userId ──────────────────────────────────────────────
// Returns all orders placed by a particular user, newest first.
const getOrdersByUser = async (req, res, next) => {
  try {
    const orders = await orderService.getOrdersByUser(req.params.userId);
    // Include a 'count' field so the caller knows the total without iterating the array
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/orders/restaurant/:restaurantId ──────────────────────────────────
// Returns all orders that belong to a specific restaurant.
const getOrdersByRestaurant = async (req, res, next) => {
  try {
    const orders = await orderService.getOrdersByRestaurant(req.params.restaurantId);
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/orders/status/:status ────────────────────────────────────────────
// Filters orders by lifecycle status (e.g. all PENDING orders).
// Useful for restaurant dashboards or delivery management screens.
const getOrdersByStatus = async (req, res, next) => {
  try {
    const orders = await orderService.getOrdersByStatus(req.params.status);
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/orders/:id/status ────────────────────────────────────────────────
// Moves an order to the next status in the lifecycle.
// req.body.status must be the target status string (e.g. "CONFIRMED").
// The service validates that the transition is legal.
const updateOrderStatus = async (req, res, next) => {
  try {
    // req.params.id  → the MongoDB _id of the order
    // req.body.status → the desired new status
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/orders/:id/cancel ────────────────────────────────────────────────
// Convenience endpoint to cancel an order.
// Only works when the order is still PENDING or CONFIRMED.
const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.params.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/orders/:id/items ─────────────────────────────────────────────────
// Replaces the entire orderItems array (e.g. customer edits their cart).
// Only allowed while the order is still PENDING.
// Totals (subtotal, tax, totalAmount) are recalculated automatically.
const updateOrderItems = async (req, res, next) => {
  try {
    // req.body.orderItems is the new array of item objects
    const order = await orderService.updateOrderItems(req.params.id, req.body.orderItems);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/orders/:id ────────────────────────────────────────────────────
// Permanently removes an order from the database.
// This is an admin-only operation — no authentication guard in this version.
const deleteOrder = async (req, res, next) => {
  try {
    await orderService.deleteOrder(req.params.id);
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Export all controller functions so orderRoutes.js can import them
module.exports = {
  createOrder,
  getOrderById,
  getOrdersByUser,
  getOrdersByRestaurant,
  getOrdersByStatus,
  updateOrderStatus,
  cancelOrder,
  updateOrderItems,
  deleteOrder,
};
