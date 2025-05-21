// ItemStatus.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext"; // ✅ Ensure this is at the top

dayjs.extend(duration);

function ItemStatus() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("checkedOut");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/items");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch items", err);
    }
  };

  const categorizeItems = () => {
    const checkedOut = items.filter(i => i.checkedOutBy && !i.isMissing && !i.isBroken);
    const missing = items.filter(i => i.isMissing);
    const broken = items.filter(i => i.isBroken);
    return { checkedOut, missing, broken };
  };

  const getLatestLog = (item) => {
    return item.logs?.slice().reverse().find(log => log.action === "check_out") || null;
  };

  const timeSinceCheckout = (checkoutTime) => {
    if (!checkoutTime) return { text: "N/A", color: "text-white" };
    const now = dayjs();
    const checkedOut = dayjs(checkoutTime);
    const diffHours = now.diff(checkedOut, "hour");
    const diffMinutes = now.diff(checkedOut, "minute") % 60;
    return {
      text: `${diffHours}h ${diffMinutes}m`,
      color: diffHours >= 12 ? "text-red-500" : "text-green-400",
    };
  };

  const handleAction = async (item, action) => {
    const now = new Date();
    const username = user?.username || "Admin"; // ← use the top-level variable
    let updates = {};
  
    const createLog = (actionName) => ({
      action: actionName,
      user: username,
      timestamp: now,
    });
  
    if (action === "checkin") {
      updates = {
        isAvailable: true,
        checkedOutBy: null,
        logs: [createLog("check_in")],
      };
    } else if (action === "lost") {
      updates = {
        isMissing: true,
        logs: [createLog("marked_missing")],
      };
    } else if (action === "broken") {
      updates = {
        isBroken: true,
        logs: [createLog("mark_broken")],
      };
    } else if (action === "found") {
      updates = {
        isMissing: false,
        isAvailable: true,
        checkedOutBy: null,
        logs: [createLog("marked_found"), createLog("check_in")],
      };
    } else if (action === "fixed") {
      updates = {
        isBroken: false,
        isAvailable: true,
        checkedOutBy: null,
        logs: [createLog("mark_fixed"), createLog("check_in")],
      };
    }
  
    try {
      await axios.put(`http://localhost:5000/api/items/${item._id}`, updates);
      fetchItems();
      setModalOpen(false);
    } catch (err) {
      console.error("Action failed", err);
    }
  };
  

  const renderItemCard = (item) => (
    <div
      key={item._id}
      className="bg-gray-800 p-4 rounded shadow cursor-pointer hover:bg-gray-700"
      onClick={() => {
        setSelectedItem(item);
        setModalOpen(true);
      }}
    >
      <h3 className="text-lg font-bold">{item.name}</h3>
      <p className="text-sm">Barcode: {item.barcode}</p>
    </div>
  );

  const handleSendToEMS = async (item) => {
    const latestLog = getLatestLog(item);
    if (!latestLog) return;
  
    try {
      await axios.post("/api/notifications/send-ems-alert", {
        itemName: item.name,
        barcode: item.barcode,
        eventNumber: latestLog.eventNumber,
        room: latestLog.room,
        clientName: latestLog.clientName,
        checkedOutBy: latestLog.user,
        initiatedBy: "Admin", // Or replace with dynamic admin username if using auth
      });
  
      alert("EMS notification sent.");
    } catch (err) {
      console.error("Failed to notify EMS:", err);
      alert("Failed to send EMS notification.");
    }
  };

  const renderModal = () => {
    if (!selectedItem) return null;
    const latestLog = getLatestLog(selectedItem);
    const time = latestLog?.timestamp ? timeSinceCheckout(latestLog.timestamp) : null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg text-white">
          <h2 className="text-xl font-bold mb-4">{selectedItem.name}</h2>
          {latestLog && (
            <div className="mb-4 space-y-1">
              <p><span className="font-semibold">Client:</span> {latestLog.clientName}</p>
              <p><span className="font-semibold">Event #:</span> {latestLog.eventNumber}</p>
              <p><span className="font-semibold">User:</span> {latestLog.user}</p>
              <p><span className="font-semibold">Location:</span> {latestLog.room}</p>
              <p><span className="font-semibold">Date:</span> {dayjs(latestLog.timestamp).format("MMM D, YYYY [at] h:mm A")}</p>
              <p className={`font-bold ${time.color}`}><span className="font-semibold">Time Out:</span> {time.text}</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {selectedItem.checkedOutBy && !selectedItem.isMissing && !selectedItem.isBroken && (
              <>
                <button onClick={() => handleAction(selectedItem, "checkin")} className="bg-green-600 px-4 py-2 rounded">Mark as Checked In</button>
                <button onClick={() => handleAction(selectedItem, "lost")} className="bg-yellow-500 px-4 py-2 rounded">Mark as Lost</button>
                <button onClick={() => handleAction(selectedItem, "broken")} className="bg-red-600 px-4 py-2 rounded">Mark as Broken</button>
              </>
            )}
            {selectedItem.isMissing && (
  <>
    <button
      onClick={() => handleAction(selectedItem, "found")}
      className="bg-blue-500 px-4 py-2 rounded"
      title="Mark the item as found and check the item in automatically."
    >
      Mark as Found
    </button>
    <button
      onClick={() => handleSendToEMS(selectedItem)}
      className="bg-red-700 px-4 py-2 rounded"
      title="Sends an email to EMS: Item was not found after event. Admin has reviewed and requests charge assessment."
    >
      Send to EMS
    </button>
  </>
)}
            {selectedItem.isBroken && (
              <button onClick={() => handleAction(selectedItem, "fixed")} className="bg-indigo-500 px-4 py-2 rounded">Mark as Fixed</button>
            )}
            <button onClick={() => setModalOpen(false)} className="bg-gray-600 px-4 py-2 rounded ml-auto">Close</button>
          </div>
        </div>
      </div>
    );
  };

  const { checkedOut, missing, broken } = categorizeItems();

  const tabs = [
    { id: "checkedOut", label: "Checked Out", items: checkedOut },
    { id: "missing", label: "Missing", items: missing },
    { id: "broken", label: "Broken", items: broken },
  ];

  return (
    <>
      <TopBar />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-3xl font-bold mb-6">Item Status Overview</h1>

        <div className="flex gap-4 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded ${activeTab === tab.id ? "bg-yellow-500" : "bg-gray-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabs.find(t => t.id === activeTab)?.items.map(renderItemCard)}
        </div>
      </div>

      {modalOpen && renderModal()}
    </>
  );
}

export default ItemStatus;