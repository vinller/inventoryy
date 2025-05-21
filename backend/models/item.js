// models/item.js
const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    action: {
        type: String,
        enum: [
            "check_in",
            "check_out",
            "marked_missing",
            "marked_lost",
            "marked_found",   // ✅ add this
            "mark_broken",    // ✅ if you're using this too
            "mark_fixed",     // ✅ also this
            "report_issue",
            "broken",
            "maintenance"
          ],                
        required: true,
      },      
  user: String,
  room: String,
  clientName: String,
  eventNumber: String,
  notes: String,
  timestamp: { type: Date, default: Date.now },
});

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  barcode: { type: String, required: true, unique: true, index: true},
  building: { type: String, required: true },
  category: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  checkedOutBy: {
    type: String, // Store username
    default: null,
  },

  isMissing: { type: Boolean, default: false },
  isBroken: { type: Boolean, default: false },

  // ✅ Optional tech bag contents (referenced by ObjectId)
  techBagContents: {
    hdmiCable: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    clicker: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    adapter: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  },
  // ✅ Mall table-specific fields
  mallChairRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  isMallTable: { type: Boolean, default: false },

  logs: [logSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Item", itemSchema);
