// pages/SystemLogs.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchAllLogs = async () => {
      try {
        const res = await axios.get("/api/items");
        const items = res.data || [];

        const allLogs = items.flatMap((item) =>
          item.logs.map((log) => ({
            ...log,
            itemName: item.name,
            barcode: item.barcode,
          }))
        );

        const sorted = allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(sorted);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        setError("Failed to load system logs");
        setLoading(false);
      }
    };

    fetchAllLogs();
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const result = logs.filter((log) => {
      const matchesSearch =
        log.itemName?.toLowerCase().includes(lowerSearch) ||
        log.user?.toLowerCase().includes(lowerSearch) ||
        log.barcode?.toLowerCase().includes(lowerSearch) ||
        log.clientName?.toLowerCase().includes(lowerSearch) ||
        log.eventNumber?.toLowerCase().includes(lowerSearch) ||
        log.room?.toLowerCase().includes(lowerSearch);
  
      const matchesAction = actionFilter ? log.action === actionFilter : true;
      const matchesDate = !selectedDate || dayjs(log.timestamp).isSame(dayjs(selectedDate), 'day');
  
      return matchesSearch && matchesAction && matchesDate;
    });
  
    setFilteredLogs(result);
    setPage(1);
  }, [search, actionFilter, selectedDate, logs]);
  
  
  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
  
    const asuMaroon = "#8C1D40";
    const asuGold = "#FFC627";
    const now = dayjs();
    const exportDate = now.format("MMMM D, YYYY");
    const exportTime = now.format("h:mm A");
    const title = `MU/STPV Inventory Records; ${now.format("MMMM, YYYY")}`;
    const logo = new Image();
    logo.src = "/images/asu-logo.png"; // Make sure it's in your public/images folder
  
    logo.onload = () => {
      const pageWidth = doc.internal.pageSize.getWidth();
  
      // Header
      doc.addImage(logo, "PNG", 40, 20, 80, 40);
      doc.setFontSize(18);
      doc.setTextColor(asuMaroon);
      doc.text(title, pageWidth / 2, 45, { align: "center" });
  
      autoTable(doc, {
        startY: 70,
        head: [[
          "Timestamp", "Action", "User", "Item Name", "Barcode", "Room", "Client", "Event #"
        ]],
        body: filteredLogs.map((log) => [
          dayjs(log.timestamp).format("MMM D, YYYY h:mm A"),
          formatAction(log.action),
          log.user || "-",
          log.itemName,
          log.barcode,
          log.room || "-",
          log.clientName || "-",
          log.eventNumber || "-"
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 4,
          halign: 'center',
          valign: 'middle',
          lineColor: [0, 0, 0],
          lineWidth: 0.1, // ✅ border around each cell
        },
        headStyles: {
          fillColor: asuGold,
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
        },
        margin: { top: 70, bottom: 80 }, // ✅ leave space for footer
        didDrawPage: (data) => {
          const footerY = doc.internal.pageSize.getHeight() - 60;
  
          // Divider line
          doc.setDrawColor(150);
          doc.setLineWidth(1); 
          doc.line(40, footerY, pageWidth - 40, footerY);
  
          // Footer text
          doc.setFontSize(10);
          doc.setTextColor(60);
          doc.text(`Exported on: ${exportDate}, at ${exportTime}`, pageWidth / 2, footerY + 15, { align: "center" });
          doc.text("Memorial Union & Student Pavilion Operations", pageWidth / 2, footerY + 30, { align: "center" });
          doc.text("Arizona State University", pageWidth / 2, footerY + 45, { align: "center" });
        }
      });
  
      doc.save(`MU STPV Logs ${now.format("MMM D YYYY")}.pdf`);
    };
  
    function formatAction(action) {
      const map = {
        check_in: "Checked In",
        check_out: "Checked Out",
        marked_missing: "Marked Missing",
        marked_lost: "Marked Lost",
        marked_found: "Marked Found",
        mark_broken: "Marked Broken",
        mark_fixed: "Marked Fixed",
        report_issue: "Reported Issue",
        broken: "Broken",
        maintenance: "Maintenance",
      };
      return map[action] || action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
  };
  

  
  const formatAction = (action) => {
    const map = {
      check_in: "Checked In",
      check_out: "Checked Out",
      marked_missing: "Marked Missing",
      marked_lost: "Marked Lost",
      marked_found: "Marked Found",
      mark_found: "Marked Found",
      mark_broken: "Marked Broken",
      mark_fixed: "Marked Fixed",
      report_issue: "Reported Issue",
      maintenance: "Maintenance",
      broken: "Broken"
    };
    return map[action] || action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const getColor = (action) => {
    switch (action) {
      case "check_in": return "text-green-400";
      case "check_out": return "text-red-400";
      case "marked_lost": return "text-yellow-300";
      case "marked_missing": return "text-yellow-300";
      case "marked_found": return "text-blue-400";
      case "mark_found": return "text-blue-400";
      case "mark_broken": return "text-orange-400";
      case "mark_fixed": return "text-indigo-400";
      case "broken": return "text-orange-400";
      case "report_issue": return "text-pink-300";
      case "maintenance": return "text-teal-300";
      default: return "text-white";
    }
  };

  const paginatedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  return (
    <>
      <TopBar />
      <div className="bg-gray-900 min-h-screen text-white p-6">
        <h2 className="text-3xl font-bold mb-6 text-asuGold text-center">System Logs</h2>

        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 text-white px-3 py-1 rounded w-64"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-gray-800 text-white px-3 py-1 rounded"
          >
            <option value="">All Actions</option>
            <option value="check_in">Check In</option>
            <option value="check_out">Check Out</option>
            <option value="marked_missing">Marked as Missing</option>
            <option value="marked_lost">Marked as Lost</option>
            <option value="marked_found">Marked as Found</option>
            <option value="mark_broken">Marked as Broken</option>
            <option value="mark_fixed">Marked as Fixed</option>
            <option value="report_issue">Reported Issue</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <input
  type="date"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
  className="bg-gray-800 text-white px-3 py-1 rounded"
/>
          <button
            onClick={exportPDF}
            className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
          >Export PDF</button>
        </div>

        {loading && <p className="text-center text-white">Loading logs...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse border border-gray-700 text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="border border-gray-700 px-3 py-2">Timestamp</th>
                  <th className="border border-gray-700 px-3 py-2">Action</th>
                  <th className="border border-gray-700 px-3 py-2">User</th>
                  <th className="border border-gray-700 px-3 py-2">Item Name</th>
                  <th className="border border-gray-700 px-3 py-2">Barcode</th>
                  <th className="border border-gray-700 px-3 py-2">Room</th>
                  <th className="border border-gray-700 px-3 py-2">Client</th>
                  <th className="border border-gray-700 px-3 py-2">Event #</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-800">
                    <td className="border border-gray-700 px-3 py-1 text-center">{dayjs(log.timestamp).format("MMM D, YYYY h:mm A")}</td>
                    <td className={`border border-gray-700 px-3 py-1 text-center capitalize ${getColor(log.action)}`}>
                      {log.action.replace(/_/g, " ")}
                    </td>
                    <td className="border border-gray-700 px-3 py-1 text-center">{log.user || "-"}</td>
                    <td className="border border-gray-700 px-3 py-1 text-center">{log.itemName}</td>
                    <td className="border border-gray-700 px-3 py-1 text-center">{log.barcode}</td>
                    <td className="border border-gray-700 px-3 py-1 text-center">{log.room || "-"}</td>
                    <td className="border border-gray-700 px-3 py-1 text-center">{log.clientName || "-"}</td>
                    <td className="border border-gray-700 px-3 py-1 text-center">{log.eventNumber || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between mt-4 text-sm">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="bg-gray-700 px-3 py-1 rounded disabled:opacity-50"
              >Prev</button>
              <span className="text-gray-300">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="bg-gray-700 px-3 py-1 rounded disabled:opacity-50"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SystemLogs;
