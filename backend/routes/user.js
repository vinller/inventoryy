// /backend/routes/user.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { authenticate } = require("../middleware/authMiddleware");

// GET all users (omit passwords)
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // exclude password
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load users" });
  }
});

// GET single user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id, "-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving user" });
  }
});

// POST create a new user
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const newUser = new User({ name, email, password, role });
    await newUser.save();
    res.status(201).json({ message: "User created", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// PUT update user by ID
router.put("/:id", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, password, role },
      { new: true }
    );
    res.json({ message: "User updated", user: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating user" });
  }
});

// DELETE user by ID
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user" });
  }
});


module.exports = router;