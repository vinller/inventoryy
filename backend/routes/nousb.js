// backend/routes/notifications.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/usb-missing", async (req, res) => {
  const { barcode, username, room, eventNumber, timestamp, missingItems = [] } = req.body;

  const formattedItems = missingItems.length
    ? `<ul>${missingItems.map(item => `<li>${item}</li>`).join("")}</ul>`
    : "<li>USB dongle</li>";

  const html = `
    <h2>⚠️ Missing Item(s) on Tech Bag Return</h2>
    <p><strong>User:</strong> ${username}</p>
    <p><strong>Event #:</strong> ${eventNumber}</p>
    <p><strong>Room:</strong> ${room}</p>
    <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
    <p><strong>Item Barcode:</strong> ${barcode}</p>
    <p><strong>Missing:</strong></p>
    ${formattedItems}
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Inventory Logger" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAILS || "vinny.24@asu.edu",
      subject: "⚠️ Missing Item on Tech Bag Return",
      html,
    });

    res.status(200).json({ message: "Alert sent" });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

module.exports = router;
