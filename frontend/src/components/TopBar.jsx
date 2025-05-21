import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // Redirect to login
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case "admin":
        return "/admin-dashboard";
      case "dev":
        return "/dev-dashboard";
      case "user":
        return "/user-dashboard";
      default:
        return "/";
    }
  };

  return (
    <div className="w-full flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-700 text-white">
      <div className="flex items-center gap-4">
        <img
          src="https://newamericanuniversity.asu.edu/modules/composer/webspark-module-asu_footer/img/ASU-EndorsedLogo.png"
          alt="ASU Logo"
          className="h-8"
        />
        {user && (
          <Link to={getDashboardPath()} className="text-asuGold font-medium hover:underline">
            Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm">
            Logged in as: <strong>{user.username}</strong> ({user.role})
          </span>
        )}
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-white text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default TopBar;
