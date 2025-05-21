import React, { useState } from "react";
import TopBar from "../components/TopBar";
import axios from "axios";

function UpdateItemStatus() {
  const [formData, setFormData] = useState({
    barcode: "",
    issueType: "missing",
    description: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      const res = await axios.post("/api/items/report-issue", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setStatus("✅ Report submitted to Admins");
      setFormData({ barcode: "", issueType: "missing", description: "" });
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to submit issue");
    }
  };

  return (
    <>
      <TopBar />
      <div className="p-6 min-h-screen bg-gray-900 text-white">
        <h2 className="text-3xl font-bold text-center text-asuGold mb-6">Report Item Issue</h2>
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto bg-gray-800 p-6 rounded-lg shadow space-y-4"
        >
          <label className="block text-sm">Item Barcode:</label>
          <input
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-500"
            required
          />

          <label className="block text-sm">Issue Type:</label>
          <select
            name="issueType"
            value={formData.issueType}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-500"
          >
            <option value="Missing">Missing</option>
            <option value="Broken">Broken</option>
            <option value="Lost">Lost</option>
            <option value="Misc">Miscellaneous</option>
          </select>

          <label className="block text-sm">Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-500"
            required
          />

          <button
            type="submit"
            className="bg-asuGold text-gray-900 px-4 py-2 rounded hover:bg-yellow-400 transition"
          >
            Submit Report
          </button>

          {status && <p className="text-sm mt-2 text-asuGold">{status}</p>}
        </form>
      </div>
    </>
  );
}

export default UpdateItemStatus;
