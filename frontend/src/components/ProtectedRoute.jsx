import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  if (!user) return <Navigate to="/" />;

  // Support both single role string or array of roles
  const allowedRoles = [].concat(requiredRole || []);
  if (requiredRole && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center text-center px-4">
        <div className="bg-gray-800 rounded-xl p-8 shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Access Denied</h1>
          <p className="text-lg mb-6">
            You are not authorized to access this page. If you think this is an error please contact an administrator.
          </p>
          <button
            onClick={() => navigate(getDashboardPath())}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
