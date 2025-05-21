// src/pages/AdminLookupCode.jsx
import React, { useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";

function AdminLookupCode() {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");

  const normalize = (text) => text?.toLowerCase().trim();

  const searchItem = async () => {
    setLoading(true);
    setItems([]);
    setError("");

    try {
      const barcodeRes = await axios.get(`/api/items/${searchTerm}`);
      if (barcodeRes.data) {
        const match = barcodeRes.data;
        const buildingMatches =
          filterBuilding === "all" ||
          normalize(match.building) ===
            (filterBuilding === "MU" ? "memorial union" : "student pavilion");
        const availMatches =
          filterAvailability === "all" ||
          (filterAvailability === "available" && match.isAvailable) ||
          (filterAvailability === "unavailable" && !match.isAvailable);

        if (buildingMatches && availMatches) {
          setItems([match]);
        } else {
          setError("Item found but filtered out");
        }
        setLoading(false);
        return;
      }
    } catch (err) {
      // continue to name search
    }

    try {
      const nameRes = await axios.get(`/api/items?name=${encodeURIComponent(searchTerm)}`);
      if (Array.isArray(nameRes.data)) {
        const filtered = nameRes.data.filter((item) => {
          const buildingMatches =
            filterBuilding === "all" ||
            normalize(item.building) ===
              (filterBuilding === "MU" ? "memorial union" : "student pavilion");

          const availMatches =
            filterAvailability === "all" ||
            (filterAvailability === "available" && item.isAvailable) ||
            (filterAvailability === "unavailable" && !item.isAvailable);

          const nameMatch = normalize(item.name).includes(normalize(searchTerm));
          const categoryMatch = normalize(item.category).includes(normalize(searchTerm));

          return (nameMatch || categoryMatch) && buildingMatches && availMatches;
        });

        if (filtered.length > 0) {
          setItems(filtered);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      // do nothing
    }

    setError("Item not found");
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") searchItem();
  };

  return (
    <>
      <TopBar />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-6 text-yellow-400">
          Lookup Barcode / QR Code
        </h2>

        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter barcode or item name/type"
            className="bg-gray-800 px-4 py-2 rounded w-80"
          />

          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          >
            <option value="all">All Buildings</option>
            <option value="MU">Memorial Union (MU)</option>
            <option value="STPV">Student Pavilion (STPV)</option>
          </select>

          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available Only</option>
            <option value="unavailable">Checked Out Only</option>
          </select>

          <button
            onClick={searchItem}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {loading && <p>Searching...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {items.length > 0 && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item._id || item.barcode}
                className="bg-gray-800 p-4 rounded shadow max-w-md"
              >
                <p className="text-lg font-semibold mb-2">Item: {item.name}</p>
                <p className="mb-1">Barcode: <code>{item.barcode}</code></p>

                {["mic", "hdmi cable"].includes(item.category?.toLowerCase()) ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${item.barcode}&size=150x150`}
                    alt="QR Code"
                    className="mx-auto mt-4"
                  />
                ) : (
                  <div className="mt-4 text-center">
                    <img
                      src={`https://barcodeapi.org/api/128/${encodeURIComponent(item.barcode)}`}
                      alt="Barcode"
                      className="mx-auto mb-2 h-16"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(item.barcode)}
                      className="text-blue-400 underline text-sm"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AdminLookupCode;
