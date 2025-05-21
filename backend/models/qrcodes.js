const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
  value: { type: String, required: true, unique: true },
  assigned: { type: Boolean, default: false },
});

module.exports = mongoose.model("QRCode", qrCodeSchema);
