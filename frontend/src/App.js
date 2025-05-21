// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import DevDashboard from "./pages/DevDashboard";
import UserDashboard from "./pages/UserDashboard";
import UserCreationForm from "./pages/UserCreationForm";
import ManageUsers from "./pages/ManageUsers";
import ManageItems from "./pages/ManageItems";
import ItemHistory from "./pages/ItemHistory";
import ProtectedRoute from "./components/ProtectedRoute";
import ScanPage from "./pages/ScanPage";
import UserHistory from "./pages/UserHistory";
import Faq from "./pages/FaqPage";
import UpdateItemStatus from "./pages/UpdateItemStatus";
import ItemStatus from "./pages/ItemStatus";
import SystemLogs from "./pages/SystemLogs";
import AdminGenerateCodes from "./pages/AdminGenerateCodes";
import AdminLookupCode from "./pages/AdminLookupCode";

import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
  path="/admin-dashboard/generate-codes"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminGenerateCodes />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-dashboard/barcodes"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminLookupCode />
    </ProtectedRoute>
  }
/>


        <Route
  path="/admin-dashboard/system-logs"
  element={
    <ProtectedRoute requiredRole="admin">
      <SystemLogs />
    </ProtectedRoute>
  }
/>

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard/manage-users"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserCreationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard/items"
          element={
            <ProtectedRoute requiredRole="admin">
              <ManageItems />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard/items/:barcode"
          element={
            <ProtectedRoute requiredRole="admin">
              <ItemHistory />
            </ProtectedRoute>
          }
        />
  <Route path="/item-status" element={
            <ProtectedRoute requiredRole="admin">
              <ItemStatus />
            </ProtectedRoute>
          } />


        {/* Dev Route */}
        <Route
          path="/dev-dashboard"
          element={
            <ProtectedRoute requiredRole="dev">
              <DevDashboard />
            </ProtectedRoute>
          }
        />
        <Route
  path="/scan"
  element={
    <ProtectedRoute requiredRole={["user", "admin"]}>
      <ScanPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/user-history"
  element={
    <ProtectedRoute requiredRole="user">
      <UserHistory />
    </ProtectedRoute>
  }
/>

<Route
  path="/faq"
  element={
    <ProtectedRoute requiredRole="user">
      <Faq />
    </ProtectedRoute>
  }
/>
<Route
  path="/update-item"
  element={
    <ProtectedRoute requiredRole="user">
      <UpdateItemStatus />
    </ProtectedRoute>
  }
/>

        {/* User Route */}
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
