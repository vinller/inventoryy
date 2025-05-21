// ManageItems.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

function ManageItems() {
  const [items, setItems] = useState([]);
  const [building, setBuilding] = useState("Memorial Union");
  const [category, setCategory] = useState("Mic");
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    building: "Memorial Union",
    category: "Mic",
    techBagContents: {
      hdmiCable: "",
      clicker: "",
      adapter: ""
    },
    mallChairRefs: [],
  });
  const [chairCount, setChairCount] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const playSound = (success) => {
    const audio = new Audio(success ? "/sounds/success.mp3" : "/sounds/fail.mp3");
    audio.play();
  };

  const categories = ["Mic", "Lavaliers", "HDMI Cable", "Tech Bag", "Clicker", "Mall Table", "Mall Chair", "Easels", "Type C Adapters"];
  const buildings = ["Memorial Union", "Student Pavilion"];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/items");
      setItems(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch items", err);
    }
  };

  const filteredItems = items.filter(
    (item) => item.building === building && item.category === category
  );

  const availableItemsByCategory = (cat) =>
    items.filter((i) => i.category === cat && i.isAvailable);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("mallChair")) {
      const index = parseInt(name.replace("mallChair", ""));
      const updatedRefs = [...formData.mallChairRefs];
      updatedRefs[index] = value;
      setFormData({ ...formData, mallChairRefs: updatedRefs });
    } else if (["hdmiCable", "clicker", "adapter"].includes(name)) {
      setFormData({
        ...formData,
        techBagContents: {
          ...formData.techBagContents,
          [name]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
  
    const user = "Admin"; // In future, pull from auth context
    const now = new Date();
    const logs = [];
  
    const prevItem = items.find(i => i._id === editingId);
  
    if (formData.isMissing && !prevItem?.isMissing) {
      logs.push({ action: "mark_missing", user, timestamp: now });
    } else if (!formData.isMissing && prevItem?.isMissing) {
      logs.push({ action: "mark_found", user, timestamp: now });
    }
  
    if (formData.isBroken && !prevItem?.isBroken) {
      logs.push({ action: "mark_broken", user, timestamp: now });
    } else if (!formData.isBroken && prevItem?.isBroken) {
      logs.push({ action: "mark_fixed", user, timestamp: now });
    }
  
    const payload = {
      name: formData.name,
      barcode: formData.barcode,
      building: formData.building,
      category: formData.category,
      ...(formData.category === "Tech Bag" && {
        techBagContents: {
          hdmiCable: formData.techBagContents.hdmiCable || undefined,
          clicker: formData.techBagContents.clicker || undefined,
          adapter: formData.techBagContents.adapter || undefined,
        },
      }),
      ...(formData.category === "Mall Table" && {
        mallChairRefs: formData.mallChairRefs.filter(Boolean),
        isMallTable: true,
      }),
      isMissing: formData.isMissing || false,
      isBroken: formData.isBroken || false,
      ...(logs.length > 0 && { $push: { logs: { $each: logs } } }),
    };
  
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/items/${editingId}`, payload);
      } else {
        await axios.post("http://localhost:5000/api/items", payload);
  
        // ✅ Mark barcode/qrcode as assigned after creation
        try {
          await axios.put("http://localhost:5000/api/barcodes/mark-assigned", {
            value: formData.barcode,
          });
        } catch (err) {
          console.warn("Code assignment update failed (non-critical):", err.response?.data?.message || err.message);
        }
      }
  
      setShowModal(false);
      resetForm();
      fetchItems();
      playSound(true);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message) {
        setStatus(err.response.data.message);
        playSound(false);
      } else {
        setStatus("❌ Failed to save item");
        playSound(false);
      }
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: "",
      barcode: "",
      building,
      category,
      techBagContents: { hdmiCable: "", clicker: "", adapter: "" },
      mallChairRefs: [],
      isMissing: false,
      isBroken: false,
    });    
    setChairCount(0);
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setFormData({
      ...item,
      techBagContents: item.techBagContents || { hdmiCable: "", clicker: "", adapter: "" },
      mallChairRefs: item.mallChairRefs?.map((c) => c.barcode) || [],
      isMissing: item.isMissing || false,
      isBroken: item.isBroken || false,
    });    
    setChairCount(item.mallChairRefs?.length || 0);
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/items/${id}`);
      try {
        const deletedItem = items.find((i) => i._id === id);
        if (deletedItem?.barcode) {
          await axios.put("http://localhost:5000/api/barcodes/mark-unassigned", {
            value: deletedItem.barcode,
          });
        }
      } catch (err) {
        console.warn("Code unassignment update failed (non-critical):", err.response?.data?.message || err.message);
      }
      
      fetchItems();
      playSound(true);
    } catch (err) {
      console.error("❌ Failed to delete item", err);
      playSound(false);
    }
  };

  return (
    <>
      <TopBar />
      <div className="min-h-screen bg-gray-900 text-white p-6">
  <div className="flex items-center justify-between mb-6">
    <h1 className="text-3xl font-bold">Item Management</h1>
    <button
      onClick={() => navigate("/item-status")}
      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
    >
      Check Item Status
    </button>
  </div>
        {/* Building & Category Selector */}
        <div className="flex gap-4 mb-6">
          {buildings.map((b) => (
            <button
              key={b}
              onClick={() => {
                setBuilding(b);
                setCategory("Mic");
              }}
              className={`px-4 py-2 rounded ${building === b ? "bg-blue-600" : "bg-gray-700"}`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="flex gap-4 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded ${category === cat ? "bg-yellow-500" : "bg-gray-700"}`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="ml-auto bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            + Add Item
          </button>
        </div>

        {status && <p className="text-red-400 mb-4">{status}</p>}

        {/* Item Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div key={item._id} className="bg-gray-800 p-4 rounded-xl shadow">
              <h2 className="text-xl font-semibold">{item.name}</h2>
              <p className="text-sm">Barcode: {item.barcode}</p>
              <p className="text-sm">Building: {item.building}</p>
              <p className="text-sm">Category: {item.category}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => navigate(`/admin-dashboard/items/${item.barcode}`)}
                  className="bg-blue-500 px-3 py-1 rounded"
                >
                  View History
                </button>
                <button onClick={() => handleEdit(item)} className="bg-yellow-500 px-3 py-1 rounded">
                  Edit
                </button>
                <button onClick={() => handleDelete(item._id)} className="bg-red-600 px-3 py-1 rounded">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Item" : "Add Item"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Item Name"
                  className="w-full p-2 bg-gray-700 rounded"
                  required
                />
                <input
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Barcode"
                  className="w-full p-2 bg-gray-700 rounded"
                  required
                />
                <select
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-700 rounded"
                >
                  {buildings.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-700 rounded"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>

                {/* Tech Bag fields */}
                {formData.category === "Tech Bag" && (
                  <>
                    <select
  name="hdmiCable"
  value={formData.techBagContents.hdmiCable}
  onChange={handleChange}
  className="w-full p-2 bg-gray-700 rounded"
>
  {(() => {
    const selected = items.find(i => i._id === formData.techBagContents.hdmiCable);
    return (
      <option value={formData.techBagContents.hdmiCable}>
        {selected ? `${selected.name} (${selected.barcode})` : "Select HDMI Cable"}
      </option>
    );
  })()}
  {availableItemsByCategory("HDMI Cable")
    .filter(i => i._id !== formData.techBagContents.hdmiCable)
    .map((item) => (
      <option key={item._id} value={item._id}>
        {item.name} ({item.barcode})
      </option>
    ))}
</select>


<select
  name="clicker"
  value={formData.techBagContents.clicker}
  onChange={handleChange}
  className="w-full p-2 bg-gray-700 rounded"
>
  {(() => {
    const selected = items.find(i => i._id === formData.techBagContents.clicker);
    return (
      <option value={formData.techBagContents.clicker}>
        {selected ? `${selected.name} (${selected.barcode})` : "Select Clicker"}
      </option>
    );
  })()}
  {availableItemsByCategory("Clicker")
    .filter(i => i._id !== formData.techBagContents.clicker)
    .map((item) => (
      <option key={item._id} value={item._id}>
        {item.name} ({item.barcode})
      </option>
    ))}
</select>


<select
  name="adapter"
  value={formData.techBagContents.adapter}
  onChange={handleChange}
  className="w-full p-2 bg-gray-700 rounded"
>
  {(() => {
    const selected = items.find(i => i._id === formData.techBagContents.adapter);
    return (
      <option value={formData.techBagContents.adapter}>
        {selected ? `${selected.name} (${selected.barcode})` : "Select Adapter"}
      </option>
    );
  })()}
  {availableItemsByCategory("Type C Adapters")
    .filter(i => i._id !== formData.techBagContents.adapter)
    .map((item) => (
      <option key={item._id} value={item._id}>
        {item.name} ({item.barcode})
      </option>
    ))}
</select>


                  </>
                )}

 {/* 🔴 isMissing Toggle */}
 <div className="mb-2">
  <p className="text-sm mb-1">Is this item missing?</p>
  <div className="flex gap-2">
    <button
      type="button"
      className={`px-3 py-1 rounded w-full ${formData.isMissing ? "bg-red-600" : "bg-gray-700"}`}
      onClick={() => setFormData({ ...formData, isMissing: true })}
    >
      ✅ Yes
    </button>
    <button
      type="button"
      className={`px-3 py-1 rounded w-full ${formData.isMissing === false ? "bg-green-600" : "bg-gray-700"}`}
      onClick={() => setFormData({ ...formData, isMissing: false })}
    >
      ❌ No
    </button>
  </div>
</div>

{/* 🔧 isBroken Toggle */}
<div className="mb-4">
  <p className="text-sm mb-1">Is this item broken?</p>
  <div className="flex gap-2">
    <button
      type="button"
      className={`px-3 py-1 rounded w-full ${formData.isBroken ? "bg-red-600" : "bg-gray-700"}`}
      onClick={() => setFormData({ ...formData, isBroken: true })}
    >
      ✅ Yes
    </button>
    <button
      type="button"
      className={`px-3 py-1 rounded w-full ${formData.isBroken === false ? "bg-green-600" : "bg-gray-700"}`}
      onClick={() => setFormData({ ...formData, isBroken: false })}
    >
      ❌ No
    </button>
  </div>
</div>
                <div className="flex justify-end gap-4">
                  <button type="submit" className="bg-green-600 px-4 py-2 rounded">Save</button>
                  <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 px-4 py-2 rounded">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ManageItems;
