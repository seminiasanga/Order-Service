// ─────────────────────────────────────────────────────────────────────────────
// src/models/Order.js  —  MONGOOSE SCHEMA FOR THE ORDER COLLECTION
//
// A Mongoose Schema is like a blueprint that defines:
//   • What fields a document (record) can have
//   • The data type of each field (String, Number, Date, Array, etc.)
//   • Validation rules (required, min, max, enum)
//   • Default values
//
// MongoDB stores data in "collections" (similar to SQL tables).
// This file maps to the "orders" collection in the "order-service" database.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

// ── Order Status Constants ────────────────────────────────────────────────────
// Object.freeze() makes this object immutable — nobody can accidentally
// add, remove, or change a status value at runtime.
// We export ORDER_STATUS so other files (service, routes) can reference
// the same single source of truth instead of hardcoding strings like "PENDING".
const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',           // Order placed, waiting for restaurant confirmation
  CONFIRMED: 'CONFIRMED',       // Restaurant accepted the order
  PREPARING: 'PREPARING',       // Kitchen is preparing the food
  READY_FOR_PICKUP: 'READY_FOR_PICKUP', // Food ready, waiting for delivery rider
  PICKED_UP: 'PICKED_UP',       // Rider picked up the food
  DELIVERED: 'DELIVERED',       // Customer received the order (terminal)
  CANCELLED: 'CANCELLED',       // Order was cancelled (terminal)
});

// ── Sub-schema: a single item inside an order ─────────────────────────────────
// We use a sub-schema (nested schema) so that each element of the orderItems
// array has predictable, validated fields.
// { _id: false } prevents Mongoose from adding a useless _id to each array item.
const orderItemSchema = new mongoose.Schema(
  {
    itemId:   { type: String, required: true },       // ID from the restaurant's menu
    name:     { type: String, required: true },       // Display name, e.g. "Margherita Pizza"
    quantity: { type: Number, required: true, min: 1 }, // At least 1 must be ordered
    price:    { type: Number, required: true, min: 0 }, // Price per single unit
    subtotal: { type: Number, min: 0 },               // Calculated: quantity × price
  },
  { _id: false }
);

// ── Sub-schema: delivery address ──────────────────────────────────────────────
const deliveryAddressSchema = new mongoose.Schema(
  {
    street:    { type: String, required: true },
    city:      { type: String, required: true },
    latitude:  { type: Number }, // GPS coordinate (optional)
    longitude: { type: Number }, // GPS coordinate (optional)
  },
  { _id: false }
);

// ── Main Order Schema ─────────────────────────────────────────────────────────
// This defines the structure of every document saved in the "orders" collection.
const orderSchema = new mongoose.Schema(
  {
    // UUID generated in the service layer — human-readable unique ID
    orderId:        { type: String, required: true, unique: true, index: true },

    // The customer who placed the order
    userId:         { type: String, required: true, index: true },

    // The restaurant that should fulfil the order
    restaurantId:   { type: String, required: true, index: true },
    restaurantName: { type: String },

    // Current lifecycle status — restricted to the values in ORDER_STATUS
    status: {
      type:    String,
      enum:    Object.values(ORDER_STATUS), // Only these string values are allowed
      default: ORDER_STATUS.PENDING,        // Every new order starts as PENDING
      index:   true,                        // Index improves query speed when filtering by status
    },

    // Array of items — uses the sub-schema above; must have at least one item
    orderItems: {
      type:     [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message:   'orderItems must contain at least one item',
      },
    },

    // Financial totals (all calculated automatically in the service layer)
    subtotal:    { type: Number, required: true, min: 0 }, // Sum of all item subtotals
    deliveryFee: { type: Number, default: 0, min: 0 },     // Flat delivery charge
    tax:         { type: Number, required: true, min: 0 }, // 10% of subtotal
    totalAmount: { type: Number, required: true, min: 0 }, // subtotal + tax + deliveryFee

    deliveryAddress: { type: deliveryAddressSchema, required: true },

    specialInstructions:  { type: String },  // e.g. "No onions, extra sauce"
    paymentId:            { type: String },  // Reference ID from the payment service
    estimatedDeliveryTime:{ type: Date },    // ETA communicated to the customer

    // Lifecycle timestamps (set automatically when status changes)
    confirmedAt: { type: Date },  // Set when status → CONFIRMED
    deliveredAt: { type: Date },  // Set when status → DELIVERED
  },
  {
    // timestamps: true automatically adds "createdAt" and "updatedAt" fields
    // Mongoose updates "updatedAt" every time the document is saved
    timestamps: true,
  }
);

// Create the Mongoose Model from the schema.
// The first argument 'Order' becomes the collection name 'orders' in MongoDB
// (Mongoose automatically pluralises and lowercases it).
const Order = mongoose.model('Order', orderSchema);

// Export both so other files can use the model AND the status constants
module.exports = { Order, ORDER_STATUS };
