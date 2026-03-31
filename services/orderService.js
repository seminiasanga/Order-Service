// ─────────────────────────────────────────────────────────────────────────────
// src/services/orderService.js  —  BUSINESS LOGIC LAYER
//
// What is a Service?
//   The service layer contains all the "rules" of the application:
//     • How totals are calculated
//     • Which status transitions are allowed
//     • What validations must pass before saving data
//
//   By keeping this logic here (away from routes and controllers), we get:
//     • Easy unit testing (call service functions directly without HTTP)
//     • Reusability (multiple controllers / jobs can share the same logic)
//     • Cleaner code (controllers stay thin and readable)
//
// Every function is async because MongoDB operations (find, save) are
// asynchronous — they talk to a remote server and we must wait for the reply.
// ─────────────────────────────────────────────────────────────────────────────

const { v4: uuidv4 } = require('uuid');
const { Order, ORDER_STATUS } = require('../models/Order');
const OrderStatusHistory = require('../models/OrderStatusHistory');

// ── Valid status transitions ──────────────────────────────────────────────────
// This object is a lookup map: given the CURRENT status, it lists which
// statuses are valid NEXT steps.
//
// Example:
//   STATUS_TRANSITIONS[ORDER_STATUS.PENDING]
//   => ['CONFIRMED', 'CANCELLED']   (the only two allowed next statuses)
//
// Anything NOT in the array is an illegal transition and will throw a 400 error.
const STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]:          [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]:        [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]:        [ORDER_STATUS.READY_FOR_PICKUP],
  [ORDER_STATUS.READY_FOR_PICKUP]: [ORDER_STATUS.PICKED_UP],
  [ORDER_STATUS.PICKED_UP]:        [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]:        [], // Terminal state — no further transitions
  [ORDER_STATUS.CANCELLED]:        [], // Terminal state — no further transitions
};

// ── Helper utilities ──────────────────────────────────────────────────────────

// round2: rounds a floating-point number to 2 decimal places.
// Why? JavaScript floats can produce results like 0.1 + 0.2 = 0.30000000000000004
// Math.round(n * 100) / 100 is a simple way to get clean currency values.
const round2 = (n) => Math.round(n * 100) / 100;

// calculateTotals: derives subtotal, tax (10%), and totalAmount from the items array.
// Formula: subtotal = sum of item.subtotal | tax = subtotal * 0.1 | total = subtotal + tax + deliveryFee
const calculateTotals = (items, deliveryFee = 0) => {
  const subtotal    = round2(items.reduce((sum, item) => sum + item.subtotal, 0));
  const tax         = round2(subtotal * 0.1);
  const totalAmount = round2(subtotal + tax + deliveryFee);
  return { subtotal, tax, totalAmount };
};

// processItems: stamps each item with subtotal = quantity x price.
// Uses spread { ...item } to avoid mutating the original object.
const processItems = (orderItems) =>
  orderItems.map((item) => ({
    ...item,
    subtotal: round2(item.quantity * item.price),
  }));

// createError: builds an Error with a custom HTTP status code so errorHandler
// knows which status code to respond with.
// Example: throw createError(404, 'Order not found')
const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// ── Service Functions ─────────────────────────────────────────────────────────

// createOrder: validates input, calculates totals, saves order, records history
const createOrder = async (data) => {
  const {
    userId,
    restaurantId,
    restaurantName,
    orderItems,
    deliveryFee = 0,
    deliveryAddress,
    specialInstructions,
    paymentId,
    estimatedDeliveryTime,
  } = data;

  // Input validation — throw 400 if required fields are missing
  if (!userId)       throw createError(400, 'userId is required');
  if (!restaurantId) throw createError(400, 'restaurantId is required');
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw createError(400, 'orderItems must be a non-empty array');
  }
  for (const item of orderItems) {
    if (!item.itemId || !item.name || !item.quantity || item.price === undefined) {
      throw createError(400, 'Each order item must have itemId, name, quantity, and price');
    }
  }
  if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
    throw createError(400, 'deliveryAddress with street and city is required');
  }

  // Calculate financials
  const processedItems = processItems(orderItems);
  const { subtotal, tax, totalAmount } = calculateTotals(processedItems, deliveryFee);

  // Build and save the new Order document
  const order = new Order({
    orderId: uuidv4(), // UUID = universally unique identifier
    userId,
    restaurantId,
    restaurantName,
    orderItems: processedItems,
    subtotal,
    deliveryFee,
    tax,
    totalAmount,
    deliveryAddress,
    specialInstructions,
    paymentId,
    estimatedDeliveryTime,
    status: ORDER_STATUS.PENDING, // Every new order starts as PENDING
  });

  await order.save(); // Writes to MongoDB

  // Write the initial PENDING record to the audit history collection
  await OrderStatusHistory.create({ orderId: order.orderId, status: ORDER_STATUS.PENDING });

  return order;
};

// getOrderById: find one order by MongoDB _id; throw 404 if missing
const getOrderById = async (id) => {
  const order = await Order.findById(id);
  if (!order) throw createError(404, 'Order not found');
  return order;
};

// getOrdersByUser: return all orders for a user, newest first
const getOrdersByUser = async (userId) => {
  return Order.find({ userId }).sort({ createdAt: -1 });
};

// getOrdersByRestaurant: return all orders for a restaurant, newest first
const getOrdersByRestaurant = async (restaurantId) => {
  return Order.find({ restaurantId }).sort({ createdAt: -1 });
};

// getOrdersByStatus: validate status then query; prevents silent empty results for typos
const getOrdersByStatus = async (status) => {
  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw createError(
      400,
      `Invalid status. Must be one of: ${Object.values(ORDER_STATUS).join(', ')}`
    );
  }
  return Order.find({ status }).sort({ createdAt: -1 });
};

// updateOrderStatus: enforce the STATUS_TRANSITIONS rules before saving
const updateOrderStatus = async (id, newStatus) => {
  if (!newStatus) throw createError(400, 'status is required');
  if (!Object.values(ORDER_STATUS).includes(newStatus)) {
    throw createError(
      400,
      `Invalid status. Must be one of: ${Object.values(ORDER_STATUS).join(', ')}`
    );
  }

  const order = await Order.findById(id);
  if (!order) throw createError(404, 'Order not found');

  // Check the transition map
  const allowed = STATUS_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    throw createError(
      400,
      `Cannot transition from ${order.status} to ${newStatus}. Allowed: ${
        allowed.join(', ') || 'none (terminal state)'
      }`
    );
  }

  order.status = newStatus;

  // Stamp lifecycle timestamps when applicable
  if (newStatus === ORDER_STATUS.CONFIRMED) order.confirmedAt = new Date();
  if (newStatus === ORDER_STATUS.DELIVERED) order.deliveredAt = new Date();

  await order.save();
  await OrderStatusHistory.create({ orderId: order.orderId, status: newStatus });

  return order;
};

// cancelOrder: only PENDING or CONFIRMED orders can be cancelled
const cancelOrder = async (id) => {
  const order = await Order.findById(id);
  if (!order) throw createError(404, 'Order not found');

  const cancellable = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];
  if (!cancellable.includes(order.status)) {
    throw createError(400, `Order cannot be cancelled when status is ${order.status}`);
  }

  order.status = ORDER_STATUS.CANCELLED;
  await order.save();
  await OrderStatusHistory.create({ orderId: order.orderId, status: ORDER_STATUS.CANCELLED });

  return order;
};

// updateOrderItems: replace items and recalculate totals; only allowed when PENDING
const updateOrderItems = async (id, orderItems) => {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw createError(400, 'orderItems must be a non-empty array');
  }
  for (const item of orderItems) {
    if (!item.itemId || !item.name || !item.quantity || item.price === undefined) {
      throw createError(400, 'Each order item must have itemId, name, quantity, and price');
    }
  }

  const order = await Order.findById(id);
  if (!order) throw createError(404, 'Order not found');

  if (order.status !== ORDER_STATUS.PENDING) {
    throw createError(400, 'Order items can only be updated while status is PENDING');
  }

  const processedItems = processItems(orderItems);
  const { subtotal, tax, totalAmount } = calculateTotals(processedItems, order.deliveryFee);

  order.orderItems  = processedItems;
  order.subtotal    = subtotal;
  order.tax         = tax;
  order.totalAmount = totalAmount;
  await order.save();

  return order;
};

// deleteOrder: permanently remove an order; returns 404 if not found
const deleteOrder = async (id) => {
  const order = await Order.findByIdAndDelete(id);
  if (!order) throw createError(404, 'Order not found');
  return order;
};

// Export all service functions so the controller can import them
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
