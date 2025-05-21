// src/pages/ScanPage.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";

function ScanPage() {
  const { user } = useAuth();
  const [barcode, setBarcode] = useState("");
  const [itemInfo, setItemInfo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [room, setRoom] = useState("");
  const [clientName, setClientName] = useState("");
  const [eventNumber, setEventNumber] = useState("");
  const [feedbackModal, setFeedbackModal] = useState({ show: false, message: "", color: "" });

  const roomInputRef = useRef(null);

  useEffect(() => {
    if (modalOpen && roomInputRef.current) {
      roomInputRef.current.focus();
    }
  }, [modalOpen]);

  useEffect(() => {
    if (feedbackModal.show) {
      const timer = setTimeout(() => {
        setFeedbackModal({ show: false, message: "", color: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackModal]);

  const playSound = (success) => {
    const audio = new Audio(success ? "/sounds/success.mp3" : "/sounds/fail.mp3");
    audio.play();
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`/api/items/${barcode}`);
      const item = res.data;
      setItemInfo(item);

      if (!item.isAvailable) {
        await axios.post(`/api/items/check-in`, {
          barcode,
          username: user.username,
        });
        setFeedbackModal({ show: true, message: "Item checked in", color: "green" });
        playSound(true);
        setBarcode("");
      } else {
        setModalOpen(true);
      }
    } catch (error) {
      setFeedbackModal({ show: true, message: "Item not found in database", color: "red" });
      playSound(false);
      setBarcode("");
      console.error(error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await axios.post(`/api/items/check-out`, {
        barcode,
        username: user.username,
        room,
        clientName,
        eventNumber,
      });
      setFeedbackModal({ show: true, message: "Item checked out", color: "green" });
      playSound(true);
      setModalOpen(false);
      setBarcode("");
      setRoom("");
      setClientName("");
      setEventNumber("");
    } catch (error) {
      setFeedbackModal({ show: true, message: "Failed to check out item", color: "red" });
      playSound(false);
      console.error(error);
    }
  };

  return (
    <>
      <TopBar />
      <div className="p-6 min-h-screen bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center text-asuGold">Scan Items</h2>

        <form onSubmit={handleBarcodeSubmit}>
          <label className="block mb-2 text-sm">Scan or Enter Barcode:</label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded w-full"
            autoFocus
            disabled={modalOpen}
          />
        </form>

        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded shadow-md w-96 text-white">
              <h3 className="text-xl font-bold mb-4">Check Out Item</h3>
              <p className="mb-2">Item: <span className="font-semibold">{itemInfo?.name}</span></p>

              <label className="block mb-1">Room:</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded text-white"
                ref={roomInputRef}
              />

              <label className="block mb-1">Client Name:</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded text-white"
              />

              <label className="block mb-1">Event Number:</label>
              <input
                type="text"
                value={eventNumber}
                onChange={(e) => setEventNumber(e.target.value)}
                className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded text-white"
              />

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckOut}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {feedbackModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div
              className={`p-6 rounded shadow-md w-96 text-white transition-all transform duration-300 ${
                feedbackModal.color === "green" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              <h3 className="text-xl font-bold mb-2 text-center">
                {feedbackModal.message}
              </h3>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ScanPage;
