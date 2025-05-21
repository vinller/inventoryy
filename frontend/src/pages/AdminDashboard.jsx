// src/pages/AdminDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const adminDashboardCards = [
    {
      title: "User Management",
      description: "Create, view, edit, or remove user accounts and assign roles.",
      path: "/admin-dashboard/users",
      icon: "👥",
    },
    {
      title: "Item Management",
      description: "Add, edit, view or delete items. Organized by building and category.",
      path: "/admin-dashboard/items",
      icon: "📦",
    },
    {
      title: "Log Items",
      description: "Record the return of checked-out equipment and update inventory status.",
      path: "/scan",
      icon: "📦",
    },
    {
      title: "System Logs",
      description: "Review backend activity and access history logs.",
      path: "/admin-dashboard/system-logs",
      icon: "📜",
    },
    {
      title: "Barcodes / QR Codes Lookup",
      description: "Look up barcodes and QR codes for inventory items.",
      path: "/admin-dashboard/barcodes",
      icon: "🔖",
    },
    {
      title: "Generate Codes",
      description: "Create new barcodes or QR codes and mark them as unassigned.",
      path: "/admin-dashboard/generate-codes",
      icon: "➕",
    },
  ];  
  

  return (
    <>
      <TopBar />

      <div className="p-6 min-h-screen bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center text-asuGold">
          Welcome, {user?.username}!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {adminDashboardCards.map((card, index) => (
    <div
      key={index}
      onClick={() => navigate(card.path)}
      className="cursor-pointer bg-gray-800 hover:bg-gray-700 transition rounded-2xl p-6 shadow-md"
    >
      <div className="text-4xl mb-2">{card.icon}</div>
      <h3 className="text-xl font-semibold mb-1">{card.title}</h3>
      <p className="text-gray-400 text-sm">{card.description}</p>
    </div>
  ))}
</div>
      </div>
    </>
  );
}

export default AdminDashboard;
