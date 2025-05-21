const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // 👈 Plaintext for dev only
  role: { type: String, enum: ["user", "admin", "dev"], default: "user" },
  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.comparePassword = function (password) {
  return password === this.password; // 👈 Insecure compare
};

module.exports = mongoose.model("User", userSchema);
