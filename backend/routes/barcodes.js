const express = require("express");
const router = express.Router();
const Barcode = require("../models/barcodes");
const QRCode = require("../models/qrcodes");
const Item = require("../models/item");

const getPrefix = (type, building) => {
  if (type === "barcode") {
    return building === "MU" ? "MU-" : "STPV-";
  } else {
    return building === "MU" ? "MU" : "STPV";
  }
};

router.post("/generate", async (req, res) => {
  const { type, quantity, building } = req.body;

  if (!quantity || quantity <= 0 || !["barcode", "qrcode"].includes(type) || !building) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  const Model = type === "barcode" ? Barcode : QRCode;
  const usedValues = new Set((await Item.find()).map(i => i.barcode));
  const existingCodes = new Set((await Model.find()).map(c => c.value));
  const generated = new Set();

  const prefix = getPrefix(type, building);
  const maxAttempts = 5000;
  let attempts = 0;

  while (generated.size < quantity && attempts < maxAttempts) {
    let code;
    if (type === "barcode") {
      // Random 6-digit padded barcode (e.g. MU-123456)
      code = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
    } else {
      // Random 6-digit QR code (e.g. STPV123456)
      code = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
    }

    if (!usedValues.has(code) && !existingCodes.has(code) && !generated.has(code)) {
      const newCode = new Model({ value: code });
      await newCode.save();
      generated.add(code);
    }

    attempts++;
  }

  res.json({ generated: Array.from(generated) });
});

router.get("/unassigned", async (req, res) => {
  const { type } = req.query;
  const Model = type === "qrcode" ? QRCode : Barcode;

  try {
    const codes = await Model.find({ assigned: false });
    res.json(codes);
  } catch (err) {
    console.error("Failed to fetch unassigned codes:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/mark-assigned", async (req, res) => {
    const { value } = req.body;
    try {
      let updated = await Barcode.updateOne({ value }, { $set: { assigned: true } });
      if (updated.modifiedCount === 0) {
        updated = await QRCode.updateOne({ value }, { $set: { assigned: true } });
      }
      if (updated.modifiedCount === 0) {
        return res.status(404).json({ message: "Code not found in barcodes or qrcodes" });
      }
      res.json({ message: "Code marked as assigned" });
    } catch (err) {
      console.error("Failed to mark code as assigned", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // PUT /api/barcodes/mark-unassigned
router.put("/mark-unassigned", async (req, res) => {
    const { value } = req.body;
    try {
      let updated = await Barcode.updateOne({ value }, { $set: { assigned: false } });
      if (updated.modifiedCount === 0) {
        updated = await QRCode.updateOne({ value }, { $set: { assigned: false } });
      }
      if (updated.modifiedCount === 0) {
        return res.status(404).json({ message: "Code not found" });
      }
      res.json({ message: "Code marked as unassigned" });
    } catch (err) {
      console.error("Failed to mark unassigned", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  router.delete("/delete-unassigned", async (req, res) => {
    try {
      const barcodeDel = await Barcode.deleteMany({ assigned: false });
      const qrcodeDel = await QRCode.deleteMany({ assigned: false });
      res.json({
        message: "Deleted all unassigned codes",
        barcodeDeleted: barcodeDel.deletedCount,
        qrcodeDeleted: qrcodeDel.deletedCount,
      });
    } catch (err) {
      console.error("Failed to delete unassigned codes:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  

module.exports = router;
