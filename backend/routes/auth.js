const express = require("express");
const router = express.Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sendPasswordEmail } = require("../utils/sendEmail");
const SECRET_KEY = process.env.JWT_SECRET || "vinny_super_secret";


router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: "Email already exists" });

  const user = new User({ name, email, password, role });

  try {
    await user.save(); // Save to database first

    const info = await sendPasswordEmail({ to: email, name, password });
    console.log(`✅ Email sent to ${email} | Message ID: ${info.messageId}`);

    res.status(201).json({ message: "User created" });
  } catch (err) {
    console.error("❌ Failed to save user or send email:", err);
    res.status(500).json({ error: "Failed to save user" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // ✅ Create token with 2-hour expiration
    const token = jwt.sign(
      {
        id: user._id,
        username: user.name,
        role: user.role,
      },
      SECRET_KEY,
      { expiresIn: "2h" } // << updated here
    );

    res.status(200).json({ message: "Login success", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get('/api/users', async (req, res) => {
  try {
    const users = await User.find(); // assumes a Mongoose model
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
