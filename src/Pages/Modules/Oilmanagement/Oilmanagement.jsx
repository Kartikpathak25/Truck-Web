import React, { useState, useEffect } from 'react';
import Sidebar from '../../../Component/Sidebar/Sidebar';
import { db } from '../../../firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import './Oilmanagement.css';

export default function Oilmanagement() {
  const [showTankerForm, setShowTankerForm] = useState(false);
  const [showTruckForm, setShowTruckForm] = useState(false);

  const [tankerData, setTankerData] = useState([]);
  const [truckData, setTruckData] = useState([]);

  // Form state
  const [tankerForm, setTankerForm] = useState({
    dateTime: '',
    quantity: '',
    tankerId: '',
    source: ''
  });

  const [truckForm, setTruckForm] = useState({
    tankerId: '',
    product: '',
    quantity: '',
    pumpName: '',
    dateReceived: '',
    driverName: '',
    fuelRemaining: ''
  });

  // Fetch Tanker Fill operations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tankerFillOperations'), snapshot => {
      setTankerData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Fetch Truck Fill operations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'truckFillOperations'), snapshot => {
      setTruckData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Handlers
  const handleTankerChange = (e) => {
    const { name, value } = e.target;
    setTankerForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTruckChange = (e) => {
    const { name, value } = e.target;
    setTruckForm(prev => ({ ...prev, [name]: value }));
  };

  const submitTankerForm = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tankerFillOperations'), {
        ...tankerForm,
        createdAt: serverTimestamp()
      });
      setTankerForm({ dateTime: '', quantity: '', tankerId: '', source: '' });
      setShowTankerForm(false);
    } catch (err) {
      console.error('Error adding tanker operation:', err);
    }
  };

  const submitTruckForm = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'truckFillOperations'), {
        ...truckForm,
        createdAt: serverTimestamp()
      });
      setTruckForm({
        tankerId: '',
        product: '',
        quantity: '',
        pumpName: '',
        dateReceived: '',
        driverName: '',
        fuelRemaining: ''
      });
      setShowTruckForm(false);
    } catch (err) {
      console.error('Error adding truck operation:', err);
    }
  };

  const deleteTanker = async (id) => {
    await deleteDoc(doc(db, 'tankerFillOperations', id));
  };

  const deleteTruck = async (id) => {
    await deleteDoc(doc(db, 'truckFillOperations', id));
  };

  return (
    <div className="oil-dashboard">
      <Sidebar />

      <div className="oil-content">
        <h2>🛢️ Oil Management</h2>

        <div className="action-buttons">
          <button
            onClick={() => { setShowTankerForm(!showTankerForm); setShowTruckForm(false); }}
          >
            🚚 Tanker Fill Truck
          </button>

          <button
            onClick={() => { setShowTruckForm(!showTruckForm); setShowTankerForm(false); }}
          >
            🛢️ Truck Fill Tanker
          </button>
        </div>

        {/* Tanker Fill Form */}
        {showTankerForm && (
          <div className="form-card">
            <h3>Tanker Fill Truck</h3>
            <form onSubmit={submitTankerForm}>
              <input type="datetime-local" name="dateTime" value={tankerForm.dateTime} onChange={handleTankerChange} required />
              <input type="number" name="quantity" placeholder="Quantity (L)" value={tankerForm.quantity} onChange={handleTankerChange} required />
              <input type="text" name="tankerId" placeholder="Tanker ID" value={tankerForm.tankerId} onChange={handleTankerChange} required />
              <input type="text" name="source" placeholder="Source Location" value={tankerForm.source} onChange={handleTankerChange} required />
              <button type="submit">Add</button>
              <button type="button" onClick={() => setShowTankerForm(false)}>Cancel</button>
            </form>
          </div>
        )}

        {/* Truck Fill Form */}
        {showTruckForm && (
          <div className="form-card">
            <h3>Truck Fill Tanker</h3>
            <form onSubmit={submitTruckForm}>
              <input type="text" name="tankerId" placeholder="Tanker ID" value={truckForm.tankerId} onChange={handleTruckChange} required />
              <input type="text" name="product" placeholder="Product" value={truckForm.product} onChange={handleTruckChange} required />
              <input type="number" name="quantity" placeholder="Quantity (L)" value={truckForm.quantity} onChange={handleTruckChange} required />
              <input type="text" name="pumpName" placeholder="Pump Name" value={truckForm.pumpName} onChange={handleTruckChange} required />
              <input type="date" name="dateReceived" value={truckForm.dateReceived} onChange={handleTruckChange} required />
              <input type="text" name="driverName" placeholder="Driver Name" value={truckForm.driverName} onChange={handleTruckChange} required />
              <input type="number" name="fuelRemaining" placeholder="Fuel Remaining (L)" value={truckForm.fuelRemaining} onChange={handleTruckChange} required />
              <button type="submit">Add</button>
              <button type="button" onClick={() => setShowTruckForm(false)}>Cancel</button>
            </form>
          </div>
        )}

        {/* Tables */}
        <div className="operations-tables">
          <h3>Tanker Fill Truck Records</h3>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Quantity</th>
                <th>Tanker ID</th>
                <th>Source</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tankerData.map(item => (
                <tr key={item.id}>
                  <td>{item.dateTime}</td>
                  <td>{item.quantity}</td>
                  <td>{item.tankerId}</td>
                  <td>{item.source}</td>
                  <td><button onClick={() => deleteTanker(item.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Truck Fill Tanker Records</h3>
          <table>
            <thead>
              <tr>
                <th>Tanker ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Pump Name</th>
                <th>Date</th>
                <th>Driver</th>
                <th>Fuel Remaining</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {truckData.map(item => (
                <tr key={item.id}>
                  <td>{item.tankerId}</td>
                  <td>{item.product}</td>
                  <td>{item.quantity}</td>
                  <td>{item.pumpName}</td>
                  <td>{item.dateReceived}</td>
                  <td>{item.driverName}</td>
                  <td>{item.fuelRemaining}</td>
                  <td><button onClick={() => deleteTruck(item.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
