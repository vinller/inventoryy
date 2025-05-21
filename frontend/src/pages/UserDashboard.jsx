// src/pages/UserDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";

function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: "Log Items",
      description: "Scan and log items via barcode.",
      path: "/scan",
      icon: "📦",
    },
    {
      title: "My History",
      description: "View your full check-in and check-out history.",
      path: "/user-history",
      icon: "📜",
    },
    {
      title: "Report Item Issue",
      description: "Report a missing, broken, or faulty item to admins.",
      path: "/update-item",
      icon: "⚠️",
    },
    {
      title: "FAQs",
      description: "Read common questions about using the system.",
      path: "/faq",
      icon: "❓",
    },
  ];

  return (
    <>
      <TopBar />
      <div className="p-6 min-h-screen bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center text-asuGold">
          Welcome, {user?.username}!
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (
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

export default UserDashboard;
