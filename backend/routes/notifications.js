const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require("../models/user");

// ----------------------- No-Show Email -----------------------
router.post("/noshow", async (req, res) => {
  const { eventNumber, org, spot, startTime, endTime, submittedBy } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const html = `
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f9f9f9;
        margin: 0;
        padding: 0;
      }
      .container {
        margin: 40px auto;
        background-color: #f9f9f9;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      }
      .header {
        background-color: #6C0018;
        color: #ffffff;
        text-align: center;
        padding: 20px;
      }
      .header img {
        max-width: 160px;
        margin-bottom: 10px;
      }
      .content {
        padding: 30px;
        text-align: left;
        color: #000000;
      }
      .content h2 {
        color: #6C0018;
      }
      .info-box {
        background-color: #d9d9d9;
        padding: 15px;
        border-radius: 5px;
        margin: 15px 0;
      }
      .info-box p {
        margin: 10px 0;
      }
      .info-box strong {
        display: inline-block;
        width: 130px;
      }
      .footer {
        background-color: #6C0018;
        color: #ffffff;
        font-size: 12px;
        padding: 15px;
        text-align: center;
      }
      .footer p:first-of-type {
        color: #F59701;
        font-weight: bold;
        margin-bottom: 4px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://newamericanuniversity.asu.edu/modules/composer/webspark-module-asu_footer/img/ASU-EndorsedLogo.png" alt="ASU Logo">
        <h1>MU/STPV Inventory System</h1>
      </div>
      <div class="content">
        <h2>Mall Table No-Show Reported</h2>
        <p>A no-show was logged by <strong>${submittedBy}</strong> for a scheduled mall table reservation. Below are the details:</p>
        <div class="info-box">
          <p><strong>Event Number:</strong> ${eventNumber}</p>
          <p><strong>Organization:</strong> ${org}</p>
          <p><strong>Tabling Spot:</strong> ${spot}</p>
          <p><strong>Start - End Time:</strong> ${startTime} - ${endTime}</p>
        </div>
        <p>Please follow up with the organization as necessary or update internal tracking records.</p>
      </div>
      <div class="footer">
        <p style="color: #F59701; margin-bottom: 5px; font-weight: bold;">Memorial Union & Student Pavilion Inventory System <br>© Arizona State University</p>
        <p style="margin-top: 5px;">This email was generated and sent by an automated system and is not monitored. Kindly refrain from replying directly to this message.</p>
      </div>
    </div>
  </body>
  </html>
`;

  try {
    await transporter.sendMail({
      from: `"Inventory Logger" <${process.env.EMAIL_USER}>`,
      to: "vinny.24@asu.edu", // or fetch from admin model if you prefer
      subject: "Mall Table No-Show Logged",
      html,
    });
    res.status(200).json({ message: "Email sent" });
  } catch (err) {
    console.error("No-show email error:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

// ----------------------- USB Missing Email -----------------------
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

// ----------------------- Missing Item Scanned -----------------------
router.post("/missing-scan", async (req, res) => {
  const { barcode, itemName, status, scannedBy, scannedAt } = req.body;

  try {
    const admins = await User.find({ role: "admin" });
    const adminEmails = admins.map((admin) => admin.email).filter(Boolean);

    if (adminEmails.length === 0) {
      return res.status(400).json({ message: "No admin emails found" });
    }

    const html = `
      <h2>🚨 ${status === "missing" ? "Missing" : "Broken"} Item Scanned</h2>
      <p><strong>User:</strong> ${scannedBy}</p>
      <p><strong>Item Name:</strong> ${itemName}</p>
      <p><strong>Barcode:</strong> ${barcode}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Scanned At:</strong> ${new Date(scannedAt).toLocaleString()}</p>
      <p>This item is marked as "${status}". Please verify its condition and update the system accordingly.</p>
    `;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Inventory Logger" <${process.env.EMAIL_USER}>`,
      to: adminEmails,
      subject: `🚨 ${status.toUpperCase()} ITEM SCANNED: ${itemName}`,
      html,
    });

    res.status(200).json({ message: "Admin alert sent" });
  } catch (err) {
    console.error("Email notification error:", err);
    res.status(500).json({ message: "Failed to notify admins" });
  }
});

router.post("/send-ems-alert", async (req, res) => {
    const { itemName, barcode, eventNumber, room, clientName, checkedOutBy, initiatedBy } = req.body;
  
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  
    const html = `
      <h2>🔔 Unreturned Inventory Item — Manual Review</h2>
      <p><strong>Checked Out By:</strong> ${checkedOutBy}</p>
      <p><strong>Client / Org:</strong> ${clientName}</p>
      <p><strong>Event Number:</strong> ${eventNumber}</p>
      <p><strong>Location:</strong> ${room}</p>
      <p><strong>Item Name:</strong> ${itemName}</p>
      <p><strong>Barcode:</strong> ${barcode}</p>
      <br>
      <p>This item was not found in the assigned room after the event concluded.</p>
      <p>It was manually reviewed and escalated by Admin <strong>${initiatedBy}</strong>.</p>
      <p>Please assess charges accordingly.</p>
    `;
  
    try {
      await transporter.sendMail({
        from: `"Inventory Logger" <${process.env.EMAIL_USER}>`,
        to: "vinny.24@asu.edu",
        subject: "Unreturned Item — EMS Action Required",
        html,
      });
  
      res.status(200).json({ message: "EMS notified" });
    } catch (err) {
      console.error("EMS email failed:", err);
      res.status(500).json({ message: "Failed to notify EMS" });
    }
  });
  

module.exports = router;
