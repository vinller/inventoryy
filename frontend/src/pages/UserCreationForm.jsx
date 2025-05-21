import React, { useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";


function UserCreationForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/register", formData);
      setStatus("✅ User created successfully!");
      setFormData({ name: "", email: "", password: "", role: "user" });
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to create user.");
    }
  };

  <TopBar />

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Create New User</h2>

        {status && <p className="mb-4">{status}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
          >
            <option value="user">User</option>
            <option value="dev">Developer</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 w-full p-2 rounded"
          >
            Create User
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserCreationForm;
