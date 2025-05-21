import React, { useState, useEffect } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";

function AdminGenerateCodes() {
  const [type, setType] = useState("barcode");
  const [quantity, setQuantity] = useState(10);
  const [building, setBuilding] = useState("MU");
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unassigned, setUnassigned] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterBuilding, setFilterBuilding] = useState("all");

  useEffect(() => {
    fetchUnassigned();
  }, []);

  const fetchUnassigned = async () => {
    try {
      const [barRes, qrRes] = await Promise.all([
        axios.get("/api/barcodes/unassigned?type=barcode"),
        axios.get("/api/barcodes/unassigned?type=qrcode"),
      ]);
      const all = [
        ...barRes.data.map((b) => ({ ...b, type: "barcode" })),
        ...qrRes.data.map((q) => ({ ...q, type: "qrcode" })),
      ];
      setUnassigned(all);
    } catch (err) {
      console.error("Error fetching unassigned codes", err);
    }
  };

  useEffect(() => {
    fetchUnassigned(); // Initial fetch on mount
  
    const interval = setInterval(() => {
      fetchUnassigned();
    }, 10000); // every 10 seconds
  
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const downloadTextFile = (filename, contentArray) => {
    const blob = new Blob([contentArray.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  

  const generateCodes = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/barcodes/generate", {
        type,
        quantity,
        building,
      });
      setResult(res.data.generated);
      fetchUnassigned();
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllUnassigned = async () => {
    if (!window.confirm("Are you sure you want to delete all unassigned codes?")) return;
  
    try {
      await axios.delete("/api/barcodes/delete-unassigned");
      alert("All unassigned codes deleted.");
      await fetchUnassigned(); // ✅ Force refresh the UI list
    } catch (err) {
      console.error("Failed to delete unassigned codes", err);
      alert("Failed to delete unassigned codes.");
    }
  };
  

  const getPrefix = () => {
    if (type === "barcode") return building === "MU" ? "MU-" : "STPV-";
    else return building === "MU" ? "MU" : "STPV";
  };

  const filteredUnassigned = unassigned.filter((code) => {
    const prefix = getPrefix();
    const buildingMatch = filterBuilding === "all" || code.value.startsWith(prefix);
    const typeMatch = filterType === "all" || code.type === filterType;
    return buildingMatch && typeMatch;
  });

  return (
    <>
      <TopBar />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-4">Generate Barcodes or QR Codes</h2>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="barcode">Barcode</option>
            <option value="qrcode">QR Code</option>
          </select>

          <select value={building} onChange={(e) => setBuilding(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="MU">Memorial Union (MU)</option>
            <option value="STPV">Student Pavilion (STPV)</option>
          </select>

          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="bg-gray-800 p-2 rounded w-20"
          />

          <button
            onClick={generateCodes}
            className="bg-yellow-500 px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Recently Generated */}
        {result.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Generated Codes:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {result.map((code) => (
                <div key={code} className="bg-gray-800 p-2 rounded shadow text-center text-sm">
                  <p className="mb-1 font-mono">{code}</p>
                  {type === "qrcode" ? (
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${code}&size=80x80`} alt="QR Code" className="mx-auto" />
                  ) : (
                    <img src={`https://barcodeapi.org/api/128/${code}`} alt="Barcode" className="mx-auto" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters + Delete Button */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          >
            <option value="all">All Types</option>
            <option value="barcode">Barcodes</option>
            <option value="qrcode">QR Codes</option>
          </select>

          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          >
            <option value="all">All Buildings</option>
            <option value="MU">Memorial Union (MU)</option>
            <option value="STPV">Student Pavilion (STPV)</option>
          </select>

          <div className="mb-4 flex flex-wrap gap-4 items-center">
          {unassigned.length > 1 && (
  <button
    onClick={deleteAllUnassigned}
    className="bg-red-600 px-4 py-2 rounded ml-auto"
  >
    Delete All Unassigned
  </button>
)}
          {result.length > 0 && (
  <button
    onClick={() => downloadTextFile("generated-codes.txt", result)}
    className="bg-blue-600 px-4 py-2 rounded"
  >
    Download Generated Codes
  </button>
)}

{unassigned.length > 0 && (
  <button
    onClick={() =>
      downloadTextFile("unassigned-codes.txt", unassigned.map((c) => c.value))
    }
    className="bg-indigo-600 px-4 py-2 rounded"
  >
    Download Unassigned Codes
  </button>
)}

</div>

        </div>

        {/* Unassigned Codes */}
        <h3 className="text-lg font-semibold mb-2">Unassigned Codes:</h3>
{filteredUnassigned.length === 0 ? (
  <p className="text-gray-400 italic">No Unassigned Codes Found</p>
) : (
  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
    {filteredUnassigned.map((code) => (
      <div key={code.value} className="bg-gray-800 p-2 rounded shadow text-center text-sm">
        <p className="mb-1 font-mono">{code.value}</p>
        {code.type === "qrcode" ? (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?data=${code.value}&size=80x80`}
            alt="QR Code"
            className="mx-auto"
          />
        ) : (
          <img
            src={`https://barcodeapi.org/api/128/${code.value}`}
            alt="Barcode"
            className="mx-auto"
          />
        )}
        <button
          onClick={() => navigator.clipboard.writeText(code.value)}
          className="text-blue-400 text-xs underline mt-1"
        >
          Copy
        </button>
      </div>
    ))}
  </div>
)}

      </div>
    </>
  );
}

export default AdminGenerateCodes;
