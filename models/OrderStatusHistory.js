// ─────────────────────────────────────────────────────────────────────────────
// src/models/OrderStatusHistory.js  —  AUDIT TRAIL FOR STATUS CHANGES
//
// Every time an order changes its status (e.g. PENDING → CONFIRMED),
// we write a record to this collection so we have a full timeline of events.
//
// This is stored in a SEPARATE collection ("order_status_history") from the
// main orders collection — a common pattern in databases for audit/history logs.
//
// Example documents for a delivered order:
//   { orderId: "abc-123", status: "PENDING",    changedAt: "10:00" }
//   { orderId: "abc-123", status: "CONFIRMED",  changedAt: "10:02" }
//   { orderId: "abc-123", status: "PREPARING",  changedAt: "10:05" }
//   { orderId: "abc-123", status: "DELIVERED",  changedAt: "10:45" }
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const orderStatusHistorySchema = new mongoose.Schema(
  {
    // The UUID orderId (from Order.orderId, NOT the MongoDB _id)
    // Indexed so we can quickly query all history records for a given order
    orderId: { type: String, required: true, index: true },

    // The status value at the time of this history entry
    status: { type: String, required: true },

    // When the status change happened — defaults to the current server time
    changedAt: { type: Date, default: Date.now },
  },
  {
    // versionKey: false removes the "__v" field Mongoose adds by default.
    // We don't need versioning on history records since we never update them.
    versionKey: false,
  }
);

// The third argument 'order_status_history' explicitly sets the MongoDB
// collection name. Without it, Mongoose would use 'orderstatushistories'.
const OrderStatusHistory = mongoose.model(
  'OrderStatusHistory',
  orderStatusHistorySchema,
  'order_status_history'
);

module.exports = OrderStatusHistory;
