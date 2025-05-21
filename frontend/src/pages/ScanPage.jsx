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
  const barcodeInputRef = useRef(null);
  const [noShowModal, setNoShowModal] = useState(false);
  const [isSubmittingNoShow, setIsSubmittingNoShow] = useState(false);
  const [confirmTechBagModal, setConfirmTechBagModal] = useState(false);
  const [clickerUsbAttached, setClickerUsbAttached] = useState(null);
  const [isCheckIn, setIsCheckIn] = useState(false);
  const [techBagDongleAttached, setTechBagDongleAttached] = useState(null);
  const [techBagCheckInBlocked, setTechBagCheckInBlocked] = useState(null);
  const [loadingCheckIn, setLoadingCheckIn] = useState(false);


  const [noShowForm, setNoShowForm] = useState({
    eventNumber: "",
    org: "",
    spot: "",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    if (modalOpen && roomInputRef.current) roomInputRef.current.focus();
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
      barcodeInputRef.current.classList.add("glow", "shake");
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
  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>
  );

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
      if (itemInfo.category === "Mall Table") {
        if (chairCount > 0 && mallChairBarcodes.slice(0, chairCount).some(b => !b.trim())) {
          setFeedbackModal({ show: true, message: "All chair barcodes must be filled.", color: "red" });
          return;
        }
      }
  
      if (itemInfo.category === "Tech Bag") {
        // 🔍 Check for any missing parts
        const missing = Object.entries(techBagVerification)
          .filter(([, verified]) => verified !== true)
          .map(([barcode]) => {
            if (itemInfo.techBagContents?.hdmiCable?.barcode === barcode) return "HDMI Cable";
            if (itemInfo.techBagContents?.clicker?.barcode === barcode) return "Clicker";
            if (itemInfo.techBagContents?.adapter?.barcode === barcode) return "Adapter";
            return "Unknown Item";
          });
  
        if (techBagDongleAttached !== true) {
          missing.push("USB dongle");
        }
  
        if (missing.length > 0) {
          // Send auto-report for missing parts
          await axios.post("/api/notifications/usb-missing", {
            barcode,
            username: user.username,
            room,
            eventNumber,
            timestamp: new Date().toISOString(),
            missingItems: missing,
          });
  
          setFeedbackModal({
            show: true,
            message: "Please check out a different bag that has all items including the USB dongle.",
            color: "red"
          });
          playSound(false);
          return;
        }
      }
  
      const payload = {
        barcode,
        username: user.username,
        room: itemInfo.category === "Mall Table" ? tablingSpot : room,
        clientName: itemInfo.category === "Mall Table" ? org : clientName,
        eventNumber,
        mallChairBarcodes: itemInfo.category === "Mall Table" ? mallChairBarcodes.filter(Boolean) : undefined,
        techBagVerification: itemInfo.category === "Tech Bag" ? techBagVerification : undefined,
        techBagDongleAttached: itemInfo.category === "Tech Bag" ? techBagDongleAttached : undefined,
      };
  
      await axios.post(`/api/items/check-out`, payload);
      setFeedbackModal({ show: true, message: "Item checked out", color: "green" });
      playSound(true);
  
      // Reset state
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
      setTechBagDongleAttached(null);
      setItemInfo(null);
      barcodeInputRef.current?.focus();
    } catch (error) {
      setFeedbackModal({
        show: true,
        message: error.response?.data?.message || "Failed to check out item",
        color: "red"
      });
      playSound(false);
    }
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

  const handleTechBagCheckInConfirm = async () => {
    setLoadingCheckIn(true); // 🟡 Show loading indicator
    const missing = [];
    const checkedInItems = [];
    const markMissing = [];
    const markCheckedIn = [];
  
    try {
      // Determine missing vs confirmed items
      for (const [barcode, verified] of Object.entries(techBagVerification)) {
        if (!verified) {
          const label =
            itemInfo.techBagContents?.hdmiCable?.barcode === barcode
              ? "HDMI Cable"
              : itemInfo.techBagContents?.clicker?.barcode === barcode
              ? "Clicker"
              : itemInfo.techBagContents?.adapter?.barcode === barcode
              ? "Adapter"
              : "Unknown Item";
  
          missing.push(label);
          markMissing.push(barcode); // 🟠 Will be marked as isMissing
        } else {
          checkedInItems.push(barcode);
          markCheckedIn.push(barcode); // 🟢 Normal check-in
        }
      }
  
      if (clickerUsbAttached === false) {
        missing.push("USB Dongle");
        // Optional: could notify further here, but no barcode to flag
      }
  
      // Send email report if anything is missing
      if (missing.length > 0) {
        await axios.post("/api/notifications/usb-missing", {
          barcode,
          username: user.username,
          room,
          eventNumber,
          timestamp: new Date().toISOString(),
          missingItems: missing,
        });
      }
  
      // Final parent Tech Bag check-in
      await axios.post("/api/items/check-in", {
        barcode,
        username: user.username,
        markMissing,
        markCheckedIn,
      });
  
      setFeedbackModal({
        show: true,
        message:
          missing.length > 0
            ? `Missing: ${missing.join(", ")}`
            : "All items checked in",
        color: missing.length > 0 ? "red" : "green",
      });
      playSound(missing.length === 0);
    } catch (error) {
      console.error("Tech Bag check-in error:", error);
      setFeedbackModal({
        show: true,
        message:
          error.response?.data?.message ||
          "Tech Bag check-in failed. Please try again.",
        color: "red",
      });
      playSound(false);
    } finally {
      // Always reset state
      setConfirmTechBagModal(false);
      setBarcode("");
      setTechBagVerification({});
      setClickerUsbAttached(null);
      setItemInfo(null);
      setLoadingCheckIn(false); // 🟢 Done loading
    }
  };
  
  
  
   
  const isCheckOutDisabled =
  !room.trim() ||
  !clientName.trim() ||
  !eventNumber.trim() ||
  false || // allow any combination of tech bag checks
  (itemInfo?.category === "Mall Table" &&
    (!tablingSpot.trim() ||
     !org.trim() ||
     (chairCount > 0 &&
      mallChairBarcodes.slice(0, chairCount).some((b) => !b.trim()))));



      const handleBarcodeSubmit = async (e) => {
        e.preventDefault();
        try {
          const res = await axios.get(`/api/items/${barcode}`);
          const item = res.data;
          if (!item) throw new Error("Item not found");
          setItemInfo(item);
      
          // 🔒 Prevent interaction with missing or broken items
          if (item.isMissing || item.isBroken) {
            setFeedbackModal({
              show: true,
              message: `This item is marked as ${item.isMissing ? "missing" : "broken"}. Please report to an admin if found.`,
              color: "red",
            });
      
            // 🔔 Optionally: notify admins
            await axios.post("/api/notifications/missing-scan", {
              barcode: item.barcode,
              itemName: item.name,
              status: item.isMissing ? "missing" : "broken",
              scannedBy: user.username,
              scannedAt: new Date().toISOString(),
            });
      
            playSound(false);
            setBarcode("");
            return;
          }
      
          // 🔐 Block if this is a child item from a Tech Bag
          if (item.belongsToTechBag) {
            setTechBagCheckInBlocked(item.belongsToTechBag);
            setFeedbackModal({
              show: true,
              message: `This item is part of Tech Bag ${item.belongsToTechBag}. Please check in the tech bag as a whole.`,
              color: "red",
            });
            playSound(false);
            setBarcode("");
            return;
          }
      
          // 🔁 Check-in flow
          if (!item.isAvailable) {
            if (item.category === "Tech Bag") {
              setIsCheckIn(true);
              setClickerUsbAttached(null);
              setConfirmTechBagModal(true);
              return;
            }
      
            await axios.post(`/api/items/check-in`, {
              barcode,
              username: user.username,
            });
      
            setFeedbackModal({ show: true, message: "Item checked in", color: "green" });
            playSound(true);
            setBarcode("");
          } else {
            // Setup for check-out modal
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
          const message = error.response?.data?.message || "Item not found in database";
          setFeedbackModal({ show: true, message, color: "red" });
          playSound(false);
          setBarcode("");
        }
      };
      

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
{techBagCheckInBlocked && (
  <div className="bg-red-600 text-white text-center p-2 rounded mb-4 font-semibold">
    Item is part of Tech Bag {techBagCheckInBlocked}. Please check in the tech bag as a whole.
  </div>
)}


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
      {Object.entries(techBagVerification).map(([barcodeKey, verified]) => {
        const part =
          barcodeKey === itemInfo.techBagContents?.hdmiCable?.barcode
            ? "HDMI Cable"
            : barcodeKey === itemInfo.techBagContents?.clicker?.barcode
            ? "Clicker"
            : barcodeKey === itemInfo.techBagContents?.adapter?.barcode
            ? "Adapter"
            : "Unknown";

        return (
          <div key={barcodeKey} className="flex items-center justify-between mb-2">
            <span>{part}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setTechBagVerification((prev) => ({ ...prev, [barcodeKey]: true }))}
                className={`px-2 py-1 rounded ${verified === true ? "bg-green-600" : "bg-gray-700"}`}
              >
                Yes
              </button>
              <button
                onClick={() => setTechBagVerification((prev) => ({ ...prev, [barcodeKey]: false }))}
                className={`px-2 py-1 rounded ${verified === false ? "bg-red-600" : "bg-gray-700"}`}
              >
                No
              </button>
            </div>
          </div>
        );
      })}

      <p className="mt-4 mb-1">Is the <span className="text-yellow-400">clicker USB dongle</span> still attached?</p>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTechBagDongleAttached(true)}
          className={`px-3 py-1 rounded w-full ${techBagDongleAttached === true ? "bg-green-600" : "bg-gray-700"}`}
        >
          Yes
        </button>
        <button
          onClick={() => setTechBagDongleAttached(false)}
          className={`px-3 py-1 rounded w-full ${techBagDongleAttached === false ? "bg-red-600" : "bg-gray-700"}`}
        >
          No
        </button>
      </div>
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
                <button
  onClick={handleCheckOut}
  disabled={isCheckOutDisabled}
  className={`px-4 py-2 rounded font-bold ${
    isCheckOutDisabled
      ? "bg-asuGold/50 text-black/50 cursor-not-allowed"
      : "bg-asuGold text-black hover:brightness-110"
  }`}
>
  Done
</button>

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
      {confirmTechBagModal && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div className="bg-gray-800 p-6 rounded shadow-lg w-[440px] text-white max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold text-asuGold mb-4">Tech Bag Check-In Confirmation</h2>

      <p className="mb-1 font-medium">Verify Contents:</p>
      {itemInfo?.techBagContents &&
        Object.entries(itemInfo.techBagContents).map(([key, item]) => (
          <div key={item?.barcode} className="flex items-center justify-between mb-2">
            <span>{item?.name}</span>
            <div className="flex gap-2">
              <button
                className={`px-2 py-1 rounded text-xs ${
                  techBagVerification[item?.barcode] === true
                    ? "bg-green-600"
                    : "bg-gray-600"
                }`}
                onClick={() =>
                  setTechBagVerification((prev) => ({
                    ...prev,
                    [item?.barcode]: true,
                  }))
                }
              >
                Yes
              </button>
              <button
                className={`px-2 py-1 rounded text-xs ${
                  techBagVerification[item?.barcode] === false
                    ? "bg-red-600 animate-shake"
                    : "bg-gray-600"
                }`}
                onClick={() => {
                  const failSound = new Audio("/sounds/fail.mp3");
                  failSound.play();
                  setTechBagVerification((prev) => ({
                    ...prev,
                    [item?.barcode]: false,
                  }));
                }}
              >
                No
              </button>
            </div>
          </div>
        ))}

      <p className="mt-4 mb-1 font-medium">
        Is the <span className="text-yellow-400">clicker USB dongle</span> still attached?
      </p>
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded w-full ${
            clickerUsbAttached === true ? "bg-green-600" : "bg-gray-700"
          }`}
          onClick={() => {
            setClickerUsbAttached(true);
            const ok = new Audio("/sounds/success.mp3");
            ok.play();
          }}
        >
          Yes
        </button>
        <button
          className={`px-3 py-1 rounded w-full ${
            clickerUsbAttached === false ? "bg-red-600 animate-shake" : "bg-gray-700"
          }`}
          onClick={() => {
            const fail = new Audio("/sounds/fail.mp3");
            fail.play();
            setClickerUsbAttached(false);
          }}
        >
          No
        </button>
      </div>

      {/* 🟡 Missing Items Summary */}
      <div className="bg-gray-700 p-3 rounded mb-4">
        <p className="text-sm font-semibold text-yellow-300">Missing Items:</p>
        <ul className="text-sm ml-4 list-disc mt-1 text-white">
          {Object.entries(techBagVerification)
            .filter(([, value]) => value === false)
            .map(([barcode]) => {
              const item = Object.values(itemInfo?.techBagContents || {}).find(
                (x) => x?.barcode === barcode
              );
              return <li key={barcode}>{item?.name || "Unknown Item"}</li>;
            })}
          {clickerUsbAttached === false && <li>USB Dongle</li>}
          {Object.values(techBagVerification).every(v => v === true) && clickerUsbAttached !== false && (
            <li className="text-green-400">None 🎉</li>
          )}
        </ul>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setConfirmTechBagModal(false)}
          className="bg-gray-600 px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
  onClick={handleTechBagCheckInConfirm}
  disabled={clickerUsbAttached === null || loadingCheckIn}
  className={`px-4 py-2 font-bold rounded ${
    loadingCheckIn
      ? "bg-gray-500 text-white cursor-not-allowed"
      : "bg-asuGold text-black hover:brightness-110"
  }`}
>
  {loadingCheckIn ? (
    <div className="flex items-center gap-2">
      <Spinner /> Submitting...
    </div>
  ) : (
    "Confirm Check-In"
  )}
</button>
      </div>
    </div>
  </div>
)}

      
    </>
  );
  
}

export default ScanPage;
