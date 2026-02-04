import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Sidebar from "../../../Component/Sidebar/Sidebar";
import "./maintananacereport.css";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";

export default function Maintananacereport() {
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
                        return data.tankerId || data.truckNumber || doc.id;
                    })
                    .filter(Boolean)
            );
        });

        return () => {
            unsubVehicles();
            unsubTankers();
        };
    }, []);

    // 🔄 Real-time maintenance data
    useEffect(() => {
        const unsubMaintenance = onSnapshot(collection(db, "maintenance"), (snapshot) => {
            const maintenanceData = snapshot.docs.map(doc => ({ id: doc.id, type: "Maintenance", ...doc.data() }));
            setAllResults(maintenanceData);

            const isEmptyFilter = !activeFilters || Object.values(activeFilters).every(val => !val);
            if (isEmptyFilter) {
                setFilteredResults(maintenanceData);
            } else {
                applyFilters(activeFilters, maintenanceData);
            }
        });

        return () => unsubMaintenance();
    }, [activeFilters]);

    // 🔍 Apply filters
    const applyFilters = (filters, dataset) => {
        const results = dataset.filter(item => {
            const createdAt = item.date ? new Date(item.date) : null;
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;

            const vehicleMatch = !filters.vehicle || item.truckNumber === filters.vehicle;
            const tankerMatch = !filters.tanker || item.truckNumber === filters.tanker;

            return vehicleMatch && tankerMatch &&
                (!startDate || (createdAt && createdAt >= startDate)) &&
                (!endDate || (createdAt && createdAt <= endDate));
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
                <h2>Maintenance Reports</h2>

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
                                <th>Tanker ID</th>
                                <th>Driver</th>
                                <th>Part Name</th>
                                <th>Notes</th>
                                <th>Price</th>
                                <th>Service Charge</th>
                                <th>Total Price</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResults.length > 0 ? (
                                filteredResults.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.type || "-"}</td>
                                        <td>{item.truckNumber || "-"}</td>
                                        <td>{item.driverName || "-"}</td>
                                        <td>{item.partName || "-"}</td>
                                        <td>{item.notes || "-"}</td>
                                        <td>{item.price || "-"}</td>
                                        <td>{item.serviceCharge || "-"}</td>
                                        <td>{item.totalPrice || "-"}</td>
                                        <td>{item.date ? new Date(item.date).toLocaleString() : "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center", padding: "1rem" }}>
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







// for vehicle id

// import React, { useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import Sidebar from "../../../Component/Sidebar/Sidebar";
// import "./maintananacereport.css";
// import { collection, onSnapshot } from "firebase/firestore";
// import { db } from "../../../firebase";

// export default function Maintananacereport() {
//     const { register, handleSubmit, reset } = useForm();
//     const [vehicles, setVehicles] = useState([]);
//     const [tankers, setTankers] = useState([]);
//     const [allResults, setAllResults] = useState([]);
//     const [filteredResults, setFilteredResults] = useState([]);
//     const [activeFilters, setActiveFilters] = useState(null);

//     // 🔄 Fetch vehicles and tankers in real-time
//     useEffect(() => {
//         const unsubVehicles = onSnapshot(collection(db, "trucks"), snapshot => {
//             setVehicles(
//                 snapshot.docs
//                     .map(doc => doc.data().truckId || doc.data().truckNumber)
//                     .filter(Boolean)
//             );
//         });

//         const unsubTankers = onSnapshot(collection(db, "tankers"), snapshot => {
//             setTankers(
//                 snapshot.docs
//                     .map(doc => {
//                         const data = doc.data();
//                         return data.tankerId || data.tankerNumber || doc.id;
//                     })
//                     .filter(Boolean)
//             );
//         });

//         return () => {
//             unsubVehicles();
//             unsubTankers();
//         };
//     }, []);

//     // 🔄 Real-time maintenance data
//     useEffect(() => {
//         const unsubMaintenance = onSnapshot(collection(db, "maintenance"), snapshot => {
//             const maintenanceData = snapshot.docs.map(doc => ({
//                 id: doc.id,
//                 type: doc.data().type || "Maintenance",
//                 ...doc.data(),
//             }));
//             setAllResults(maintenanceData);

//             const isEmptyFilter =
//                 !activeFilters || Object.values(activeFilters).every(val => !val);
//             if (isEmptyFilter) {
//                 setFilteredResults(maintenanceData);
//             } else {
//                 applyFilters(activeFilters, maintenanceData);
//             }
//         });

//         return () => unsubMaintenance();
//     }, [activeFilters]);

//     // 🔍 Apply filters
//     const applyFilters = (filters, dataset) => {
//         const results = dataset.filter(item => {
//             const createdAt = item.date ? new Date(item.date) : null;
//             const startDate = filters.startDate ? new Date(filters.startDate) : null;
//             const endDate = filters.endDate ? new Date(filters.endDate) : null;

//             const vehicleMatch =
//                 !filters.vehicle ||
//                 item.vehicleId === filters.vehicle ||
//                 item.truckNumber === filters.vehicle;

//             const tankerMatch =
//                 !filters.tanker ||
//                 item.tankerId === filters.tanker ||
//                 item.tankerNumber === filters.tanker;

//             return (
//                 vehicleMatch &&
//                 tankerMatch &&
//                 (!startDate || (createdAt && createdAt >= startDate)) &&
//                 (!endDate || (createdAt && createdAt <= endDate))
//             );
//         });

//         setFilteredResults(results);
//     };

//     // 🔘 Handle filter submit
//     const onSubmit = data => {
//         setActiveFilters(data);
//         applyFilters(data, allResults);
//     };

//     // 🔘 Clear filters
//     const clearFilters = () => {
//         reset();
//         setActiveFilters(null);
//         setFilteredResults(allResults);
//     };

//     return (
//         <div className="report-container">
//             <Sidebar />
//             <div className="report-content">
//                 <h2>Maintenance Reports</h2>

//                 {/* 🔹 Filter Form */}
//                 <form className="filter-form" onSubmit={handleSubmit(onSubmit)}>
//                     <select {...register("vehicle")}>
//                         <option value="">All Vehicles</option>
//                         {vehicles.map((v, i) => (
//                             <option key={i} value={v}>
//                                 {v}
//                             </option>
//                         ))}
//                     </select>

//                     <select {...register("tanker")}>
//                         <option value="">All Tankers</option>
//                         {tankers.map((t, i) => (
//                             <option key={i} value={t}>
//                                 {t}
//                             </option>
//                         ))}
//                     </select>

//                     <input type="date" {...register("startDate")} />
//                     <input type="date" {...register("endDate")} />

//                     <button type="submit">Filter</button>
//                     <button
//                         type="button"
//                         onClick={clearFilters}
//                         className="clear-btn"
//                     >
//                         Clear All
//                     </button>
//                 </form>

//                 {/* 🔹 Results Table */}
//                 <div className="results-table">
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Type</th>
//                                 <th>Vehicle ID</th>
//                                 <th>Tanker ID</th>
//                                 <th>Driver</th>
//                                 <th>Part Name</th>
//                                 <th>Notes</th>
//                                 <th>Price</th>
//                                 <th>Service Charge</th>
//                                 <th>Total Price</th>
//                                 <th>Date</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {filteredResults.length > 0 ? (
//                                 filteredResults.map((item, i) => (
//                                     <tr key={i}>
//                                         <td>{item.type || "-"}</td>
//                                         <td>{item.vehicleId || "-"}</td>   {/* ✅ Vehicle ID */}
//                                         <td>{item.tankerId || "-"}</td>    {/* ✅ Tanker ID */}
//                                         <td>{item.driverName || "-"}</td>
//                                         <td>{item.partName || "-"}</td>
//                                         <td>{item.notes || "-"}</td>
//                                         <td>{item.price || "-"}</td>
//                                         <td>{item.serviceCharge || "-"}</td>
//                                         <td>{item.totalPrice || "-"}</td>
//                                         <td>{item.date ? new Date(item.date).toLocaleString() : "-"}</td>
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr>
//                                     <td
//                                         colSpan="10"
//                                         style={{ textAlign: "center", padding: "1rem" }}
//                                     >
//                                         No data found.
//                                     </td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// }
