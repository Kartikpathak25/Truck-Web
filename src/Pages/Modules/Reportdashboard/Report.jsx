import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Sidebar from "../../../Component/Sidebar/Sidebar";
import "./Report.css";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

export default function Report() {
    const { register, handleSubmit, reset } = useForm();
    const [vehicles, setVehicles] = useState([]);
    const [tankers, setTankers] = useState([]);
    const [allResults, setAllResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [activeFilters, setActiveFilters] = useState(null);


    useEffect(() => {
        const unsubVehicles = onSnapshot(collection(db, "trucks"), snapshot => {
            setVehicles(
                snapshot.docs
                    .map(doc => doc.data().truckId || doc.data().truckNumber)
                    .filter(Boolean)
            );
        });

        const unsubTankers = onSnapshot(collection(db, "tankers"), snapshot => {
            setTankers(
                snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        return data.tankerId || data.truckNumber || doc.id; // ✅ fallback logic
                    })
                    .filter(Boolean)
            );
        });

        return () => {
            unsubVehicles();
            unsubTankers();
        };
    }, []);






    // 🔄 Real-time fuel filling data
    useEffect(() => {
        const truckFill = collection(db, "truckFillOperations");
        const tankerFill = collection(db, "tankerFillOperations");
        const pumpFill = collection(db, "tankerFillOperationsPump");

        const unsubTruck = onSnapshot(truckFill, updateCombinedData);
        const unsubTanker = onSnapshot(tankerFill, updateCombinedData);
        const unsubPump = onSnapshot(pumpFill, updateCombinedData);

        return () => {
            unsubTruck();
            unsubTanker();
            unsubPump();
        };
    }, [activeFilters]);

    // 🔧 Refresh combined dataset
    const updateCombinedData = async () => {
        const [truckSnap, tankerSnap, pumpSnap] = await Promise.all([
            getDocs(collection(db, "truckFillOperations")),
            getDocs(collection(db, "tankerFillOperations")),
            getDocs(collection(db, "tankerFillOperationsPump"))
        ]);

        const truckData = truckSnap.docs.map(doc => ({ id: doc.id, type: "Truck Fill", ...doc.data() }));
        const tankerData = tankerSnap.docs.map(doc => ({ id: doc.id, type: "Vehicle Fill", ...doc.data() }));
        const pumpData = pumpSnap.docs.map(doc => ({ id: doc.id, type: "Tanker Fill", ...doc.data() }));

        const combined = [...truckData, ...tankerData, ...pumpData];
        setAllResults(combined);

        const isEmptyFilter = !activeFilters || Object.values(activeFilters).every(val => !val);
        if (isEmptyFilter) {
            setFilteredResults(combined);
        } else {
            applyFilters(activeFilters, combined);
        }
    };

    // 🔍 Apply filters
    const applyFilters = (filters, dataset) => {
        const results = dataset.filter(item => {
            const createdAt = item.createdAt?.toDate?.() || new Date(item.createdAt);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;

            return (
                (!filters.vehicle || item.truckId === filters.vehicle) &&
                (!filters.tanker || item.tankerId === filters.tanker) &&
                (!startDate || createdAt >= startDate) &&
                (!endDate || createdAt <= endDate)
            );
        });

        setFilteredResults(results);
    };

    // 🔘 Handle filter submit
    const onSubmit = (data) => {
        setActiveFilters(data);
        applyFilters(data, allResults);
    };

    // 🔘 Clear filters
    const clearFilters = () => {
        reset();
        setActiveFilters(null);
        setFilteredResults(allResults);
    };

    return (
        <div className="report-container">
            <Sidebar />
            <div className="report-content">
                <h2>Fuel Filling & Reports</h2>

                <form className="filter-form" onSubmit={handleSubmit(onSubmit)}>
                    <select {...register("vehicle")}>
                        <option value="">All Vehicles</option>
                        {vehicles.map((v, i) => (
                            <option key={i} value={v}>{v}</option>
                        ))}
                    </select>

                    <select {...register("tanker")}>
                        <option value="">All Tankers</option>
                        {tankers.map((t, i) => (
                            <option key={i} value={t}>{t}</option>
                        ))}
                    </select>


                    <input type="date" {...register("startDate")} />
                    <input type="date" {...register("endDate")} />

                    <button type="submit">Filter</button>
                    <button type="button" onClick={clearFilters} className="clear-btn">
                        Clear All
                    </button>
                </form>

                {/* 🔹 Results Table */}
                <div className="results-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Vehicle ID</th>
                                <th>Tanker ID</th>
                                <th>Driver</th>
                                <th>Location</th>
                                <th>KM Reading</th>
                                <th>Fuel Qty (L)</th>
                                <th>Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResults.length > 0 ? (
                                filteredResults.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.type || "-"}</td>
                                        <td>{item.truckId || "-"}</td>
                                        <td>{item.tankerId || "-"}</td>
                                        <td>{item.driverName || "-"}</td>
                                        <td>{item.location || item.source || item.pumpName || "-"}</td>
                                        <td>{item.currentReading || "-"}</td>
                                        <td>{item.filledQty || item.filledOil || item.capacity || "-"}</td>
                                        <td>{item.createdAt?.toDate?.().toLocaleString() || item.dateTime || item.dateReceived || "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "1rem" }}>
                                        No data found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
