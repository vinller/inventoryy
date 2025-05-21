// src/pages/UserProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${id}/activity`);
        setUserData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserActivity();
  }, [id]);

  if (loading) return <p className="text-white p-4">Loading...</p>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;
  if (!userData) return null;

  const { user, logins, checkouts } = userData;

  return (
    <div className="p-8 text-white">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>

      <h3 className="text-xl font-semibold mt-6 mb-2">Login History</h3>
      <ul className="mb-6 list-disc list-inside">
        {logins.map((log, idx) => (
          <li key={idx}>{new Date(log.timestamp).toLocaleString()} — {log.location || "Unknown"}</li>
        ))}
      </ul>

      <h3 className="text-xl font-semibold mb-2">Check-in/Checkout Logs</h3>
      <ul className="list-disc list-inside">
        {checkouts.map((entry, idx) => (
          <li key={idx}>{entry.type} - {entry.item} @ {new Date(entry.timestamp).toLocaleString()}</li>
        ))}
      </ul>

      <button
        className="mt-6 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        onClick={() => navigate(-1)}
      >
        Back
      </button>
    </div>
  );
}

export default UserProfile;