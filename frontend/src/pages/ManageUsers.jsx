// src/pages/ManageUsers.jsx
import React, { useEffect, useState, useEffect as useEffectRef } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "user" });
  const [statusModal, setStatusModal] = useState({ show: false, message: "", color: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (statusModal.show) {
      const sound = new Audio(statusModal.color === "green" ? "/sounds/success.mp3" : "/sounds/fail.mp3");
      sound.play();
      const timer = setTimeout(() => setStatusModal({ show: false, message: "", color: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusModal]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users", err);
      setStatusModal({ show: true, message: "Failed to load users", color: "red" });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePassword = () => {
    const randomPass = Math.random().toString(36).slice(-10);
    setFormData({ ...formData, password: randomPass });
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/users/${editingUserId}`, formData);
        setStatusModal({ show: true, message: "User updated", color: "green" });
      } else {
        await axios.post("/api/auth/register", formData);
        setStatusModal({ show: true, message: "User created", color: "green" });
      }
      setFormData({ name: "", email: "", password: "", role: "user" });
      setIsEditing(false);
      setEditingUserId(null);
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error("User creation/update failed", err);
      setStatusModal({ show: true, message: "Failed to save user", color: "red" });
    }
  };

  const handleEdit = (user) => {
    setFormData({ name: user.name, email: user.email, password: "", role: user.role });
    setEditingUserId(user._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`/api/users/${id}`);
      setUsers(users.filter((user) => user._id !== id));
      setStatusModal({ show: true, message: "User deleted", color: "green" });
    } catch (err) {
      setStatusModal({ show: true, message: "Failed to delete user", color: "red" });
    }
  };

  const filteredUsers = users.filter((user) => roleFilter === "all" || user.role === roleFilter);

  return (
    <>
      <TopBar />
      <div className="min-h-screen bg-gray-900 text-white p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            onClick={() => {
              setIsEditing(false);
              setFormData({ name: "", email: "", password: "", role: "user" });
              setShowModal(true);
            }}
          >
            + Create User
          </button>
        </div>

        <div className="mb-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="dev">Dev</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div key={user._id} className="bg-gray-800 p-4 rounded-xl shadow">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-300 text-sm">{user.email}</p>
              <p className="text-gray-400 text-sm capitalize mb-3">{user.role}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="bg-yellow-500 px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? "Edit User" : "Create User"}
              </h2>
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="password"
                  placeholder="Password"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  value={formData.password}
                  onChange={handleChange}
                  required={!isEditing}
                />
                <button
                  type="button"
                  className="text-blue-400 underline text-sm"
                  onClick={generatePassword}
                >
                  Generate Strong Password
                </button>
                <select
                  name="role"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">User</option>
                  <option value="dev">Dev</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex justify-between">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                  >
                    {isEditing ? "Update User" : "Create User"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {statusModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
            <div
              className={`p-6 rounded shadow-md w-96 text-white transition-all transform duration-300 ${
                statusModal.color === "green" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              <h3 className="text-xl font-bold mb-2 text-center">{statusModal.message}</h3>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ManageUsers;
