// src/pages/ScanPage.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import moment from "moment";
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
  const [techBagVerification, setTechBagVerification] = useState({});
  const [mallChairBarcodes, setMallChairBarcodes] = useState(["", ""]);
  const [chairCount, setChairCount] = useState(0);
  const [arrivalStatus, setArrivalStatus] = useState("On-Time");
  const [arrivalTime] = useState(moment().format("HH:mm"));
  const [tablingSpot, setTablingSpot] = useState("");
  const [org, setOrg] = useState("");
  const [feedbackModal, setFeedbackModal] = useState({ show: false, message: "", color: "" });
  const [chairErrors, setChairErrors] = useState([null, null]);
  const roomInputRef = useRef(null);
  const [noShowModal, setNoShowModal] = useState(false);
  const [isSubmittingNoShow, setIsSubmittingNoShow] = useState(false);
  const barcodeInputRef = useRef(null);
const [noShowForm, setNoShowForm] = useState({
  eventNumber: "",
  org: "",
  spot: "",
  startTime: "",
  endTime: ""
});


  useEffect(() => {
    if (modalOpen && roomInputRef.current) roomInputRef.current.focus();
  }, [modalOpen]);
  useEffect(() => {
    if (!modalOpen && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
  
      // Add glow and shake
      barcodeInputRef.current.classList.add("glow", "shake");
  
      // Remove animations after they're done
      const timeout = setTimeout(() => {
        barcodeInputRef.current?.classList.remove("glow", "shake");
      }, 500);
  
      return () => clearTimeout(timeout);
    }
  }, [modalOpen]);
  
  
  
  useEffect(() => {
    if (feedbackModal.show) {
      const timer = setTimeout(() => setFeedbackModal({ show: false, message: "", color: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackModal]);

  const playSound = (success) => {
    const audio = new Audio(success ? "/sounds/success.mp3" : "/sounds/fail.mp3");
    audio.play();
  };

  const validateChairBarcode = async (barcode, index) => {
    try {
      const { data } = await axios.get(`/api/items/${barcode}`);
      if (data.category !== "Mall Chair") {
        throw new Error(`${barcode} is not a Mall Chair.`);
      }
      if (!data.isAvailable) {
        throw new Error(`${barcode} is already checked out.`);
      }
      const updated = [...mallChairBarcodes];
      updated[index] = barcode;
      setMallChairBarcodes(updated);

      const errorUpdates = [...chairErrors];
      errorUpdates[index] = null;
      setChairErrors(errorUpdates);
      playSound(true);
    } catch (err) {
      const updated = [...mallChairBarcodes];
      updated[index] = "";
      setMallChairBarcodes(updated);

      const errorUpdates = [...chairErrors];
      errorUpdates[index] = err.message;
      setChairErrors(errorUpdates);

      setFeedbackModal({ show: true, message: err.message, color: "red" });
      playSound(false);
    }
  };

  const handleChairInputKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      validateChairBarcode(e.target.value, index);
    }
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`/api/items/${barcode}`);
      const item = res.data;
      if (!item) throw new Error("Item not found");
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
        if (item.category === "Tech Bag") {
          setTechBagVerification({
            [item.techBagContents?.hdmiCable?.barcode]: false,
            [item.techBagContents?.clicker?.barcode]: false,
            [item.techBagContents?.adapter?.barcode]: false,
          });
        }
        if (item.category === "Mall Table") {
          setChairCount(0);
          setMallChairBarcodes(["", ""]);
          setChairErrors([null, null]);
        }
        setModalOpen(true);
      }
    } catch (error) {
      console.error(error);
      setFeedbackModal({ show: true, message: "Item not found in database", color: "red" });
      playSound(false);
      setBarcode("");
    }
  };

const handleNoShowSubmit = async () => {
  setIsSubmittingNoShow(true);
  try {
    await axios.post("/api/notifications/noshow", {
      ...noShowForm,
      submittedBy: user.username
    });

    setFeedbackModal({ show: true, message: "No-show logged.", color: "green" });
    setNoShowForm({ eventNumber: "", org: "", spot: "", startTime: "", endTime: "" });
    setNoShowModal(false);
    playSound(true);
  } catch (err) {
    setFeedbackModal({ show: true, message: "Failed to submit no-show. Try again or contact an Admin", color: "red" });
    playSound(false);
  } finally {
    setIsSubmittingNoShow(false);
  }
};

  

  const handleCheckOut = async () => {
    try {
      const payload = {
        barcode,
        username: user.username,
        room,
        clientName,
        eventNumber,
      };

      if (itemInfo.category === "Tech Bag") {
        payload.techBagVerification = techBagVerification;
      }

      if (itemInfo.category === "Mall Table") {
        payload.room = tablingSpot;
        payload.clientName = org;
        payload.mallChairBarcodes = mallChairBarcodes.filter(Boolean);
      }

      await axios.post(`/api/items/check-out`, payload);
      setFeedbackModal({ show: true, message: "Item checked out", color: "green" });
      playSound(true);
      setModalOpen(false);
      setBarcode("");
      setRoom("");
      setClientName("");
      setEventNumber("");
      setTablingSpot("");
      setOrg("");
      setMallChairBarcodes(["", ""]);
      setChairErrors([null, null]);
      setChairCount(0);
      setTechBagVerification({});
      setItemInfo(null);
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    } catch (error) {
      console.error(error);
      setFeedbackModal({ show: true, message: error.response?.data?.message || "Failed to check out item", color: "red" });
      playSound(false);
    }
  };

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>
  );

  return (
    <>
      <TopBar />
      <div className="p-6 min-h-screen bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center text-asuGold">Scan Items</h2>

        <div className="flex flex-col items-center gap-4 mb-10 max-w-xl mx-auto">
  <form onSubmit={handleBarcodeSubmit} className="w-full">
    <label className="block mb-2 text-sm text-center">Scan or Enter Barcode:</label>
    <input
  type="text"
  value={barcode}
  onChange={(e) => setBarcode(e.target.value)}
  className={`bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded w-full transition-shadow duration-300 ${
    barcodeInputRef.current && barcodeInputRef.current.classList.contains("glow") ? "shadow-lg shadow-asuGold" : ""
  }`}
  autoFocus
  ref={barcodeInputRef}
  disabled={modalOpen}
/>
  </form>

  <button
    onClick={() => setNoShowModal(true)}
    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
  >
    Log No-Show for Mall Table
  </button>
</div>


{noShowModal && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div className="bg-gray-800 p-6 rounded shadow-md w-96 text-white">
      <h3 className="text-xl font-bold mb-4">No-Show Submission</h3>
      <input
        type="text"
        placeholder="Event Number"
        value={noShowForm.eventNumber}
        onChange={(e) => setNoShowForm({ ...noShowForm, eventNumber: e.target.value })}
        className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded"
      />
      <input
        type="text"
        placeholder="Tabling Spot"
        value={noShowForm.spot}
        onChange={(e) => setNoShowForm({ ...noShowForm, spot: e.target.value })}
        className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded"
      />
      <input
        type="text"
        placeholder="Organization"
        value={noShowForm.org}
        onChange={(e) => setNoShowForm({ ...noShowForm, org: e.target.value })}
        className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded"
      />
      <label className="block mb-1">Start Time:</label>
<input
  type="time"
  value={noShowForm.startTime}
  onChange={(e) => setNoShowForm({ ...noShowForm, startTime: e.target.value })}
  className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded"
/>

<label className="block mb-1">End Time:</label>
<input
  type="time"
  value={noShowForm.endTime}
  onChange={(e) => setNoShowForm({ ...noShowForm, endTime: e.target.value })}
  className="bg-gray-700 border border-gray-500 w-full p-2 mb-4 rounded"
/>

      <div className="flex justify-end gap-2">
        <button onClick={() => setNoShowModal(false)} className="px-4 py-2 bg-gray-600 rounded">Cancel</button>
        <button
  onClick={handleNoShowSubmit}
  className="px-4 py-2 bg-red-500 rounded flex items-center justify-center"
  disabled={isSubmittingNoShow}
>
  {isSubmittingNoShow ? (
    <>
      <Spinner />
      Logging No-Show...
    </>
  ) : (
    "Submit"
  )}
</button>


      </div>
    </div>
  </div>
)}



        {modalOpen && itemInfo && (
          <div className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition duration-300 ${isSubmittingNoShow ? "backdrop-blur-sm" : ""}`}>

            <div className="bg-gray-800 p-6 rounded shadow-md w-96 text-white max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Check Out Item</h3>
              <p className="mb-2">Item: <span className="font-semibold">{itemInfo.name}</span></p>

              <label className="block mb-1">Room:</label>
              <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded" ref={roomInputRef} />
              <label className="block mb-1">Client Name:</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded" />
              <label className="block mb-1">Event Number:</label>
              <input type="text" value={eventNumber} onChange={(e) => setEventNumber(e.target.value)} className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded" />

              {itemInfo.category === "Tech Bag" && (
                <div className="mb-4">
                  <h4 className="font-semibold text-lg mb-2">Verify Contents</h4>
                  {Object.entries(techBagVerification).map(([barcode, verified]) => {
                    const part = [
                      itemInfo.techBagContents?.hdmiCable,
                      itemInfo.techBagContents?.clicker,
                      itemInfo.techBagContents?.adapter,
                    ].find(p => p?.barcode === barcode);
                    return (
                      <div key={barcode} className="flex items-center gap-2">
                        <label>{part ? `${part.name} (${barcode})` : barcode}</label>
                        <input
                          type="checkbox"
                          checked={verified}
                          onChange={() => setTechBagVerification((prev) => ({ ...prev, [barcode]: !prev[barcode] }))}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {itemInfo.category === "Mall Table" && (
                <div className="mb-4">
                  <label className="block mb-1">Arrival Time:</label>
                  <input type="text" value={arrivalTime} readOnly className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded" />
                  <label className="block mb-1">Arrival Status:</label>
                  <select value={arrivalStatus} onChange={(e) => setArrivalStatus(e.target.value)} className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded">
                    <option>On-Time</option>
                    <option>Late</option>
                  </select>
                  <label className="block mb-1">Organization:</label>
                  <input type="text" value={org} onChange={(e) => setOrg(e.target.value)} className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded" />
                  <label className="block mb-1">Tabling Spot:</label>
                  <input type="text" value={tablingSpot} onChange={(e) => setTablingSpot(e.target.value)} className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded" />
                  <label className="block mb-1">Number of Chairs:</label>
                  <select value={chairCount} onChange={(e) => {
                    const count = parseInt(e.target.value);
                    setChairCount(count);
                    setMallChairBarcodes(Array(count).fill(""));
                    setChairErrors(Array(count).fill(null));
                  }} className="bg-gray-700 border border-gray-500 w-full p-2 mb-3 rounded">
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                  {[...Array(chairCount)].map((_, i) => (
                    <div key={i}>
                      <input
                        type="text"
                        value={mallChairBarcodes[i] || ""}
                        onChange={(e) => {
                          const updated = [...mallChairBarcodes];
                          updated[i] = e.target.value;
                          setMallChairBarcodes(updated);
                        }}
                        onKeyDown={(e) => handleChairInputKeyDown(e, i)}
                        placeholder={`Chair ${i + 1} Barcode`}
                        className="bg-gray-700 border border-gray-500 w-full p-2 mb-1 rounded"
                      />
                      {chairErrors[i] && <p className="text-red-400 text-sm mb-2">{chairErrors[i]}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancel</button>
                <button onClick={handleCheckOut} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Done</button>
              </div>
            </div>
          </div>
        )}

        {feedbackModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div className={`p-6 rounded shadow-md w-96 text-white transition-all transform duration-300 ${feedbackModal.color === "green" ? "bg-green-600" : "bg-red-600"}`}>
              <h3 className="text-xl font-bold mb-2 text-center">{feedbackModal.message}</h3>
            </div>
          </div>
        )}
      </div>

      
    </>
  );
}

export default ScanPage;
