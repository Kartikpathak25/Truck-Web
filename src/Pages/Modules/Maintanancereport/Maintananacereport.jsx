import React, { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import Sidebar from "../../../Component/Sidebar/Sidebar";
import "./maintananacereport.css";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";
import * as XLSX from "xlsx";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABLE_HEADERS = [
    { label: "Type", key: "type" },
    { label: "Vehicle / Tanker", key: "truckNumber" },
    { label: "Driver", key: "driverName" },
    { label: "Part Name", key: "partName" },
    { label: "Notes", key: "notes" },
    { label: "Price", key: "price" },
    { label: "Service Charge", key: "serviceCharge" },
    { label: "Total Price", key: "totalPrice" },
    { label: "Date", key: "_date" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const resolveDate = (item) =>
    item.date ? new Date(item.date).toLocaleString() : "-";

const matchesFilters = (item, filters) => {
    const { vehicle, tanker, startDate, endDate } = filters;
    const itemDate = item.date ? new Date(item.date) : null;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;

    return (
        (!vehicle || item.truckNumber === vehicle) &&
        (!tanker || item.truckNumber === tanker) &&
        (!start || (itemDate && itemDate >= start)) &&
        (!end || (itemDate && itemDate <= end))
    );
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Maintananacereport() {
    const { register, handleSubmit, reset } = useForm();

    const [vehicles, setVehicles] = useState([]);
    const [tankers, setTankers] = useState([]);
    const [allResults, setAllResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [activeFilters, setActiveFilters] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const allResultsRef = useRef([]);
    const activeFiltersRef = useRef(null);
    allResultsRef.current = allResults;
    activeFiltersRef.current = activeFilters;

    // ── Dropdown data ─────────────────────────────────────────────────────────
    useEffect(() => {
        const unsubV = onSnapshot(collection(db, "trucks"), (snap) =>
            setVehicles(
                snap.docs.map((d) => d.data().truckId || d.data().truckNumber).filter(Boolean)
            )
        );
        const unsubT = onSnapshot(collection(db, "tankers"), (snap) =>
            setTankers(
                snap.docs
                    .map((d) => {
                        const data = d.data();
                        return data.tankerId || data.truckNumber || d.id;
                    })
                    .filter(Boolean)
            )
        );
        return () => { unsubV(); unsubT(); };
    }, []);

    // ── Real-time maintenance data ─────────────────────────────────────────────
    useEffect(() => {
        setIsLoading(true);
        const unsub = onSnapshot(collection(db, "maintenance"), (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                type: "Maintenance",
                ...doc.data(),
            }));

            setAllResults(data);

            const filters = activeFiltersRef.current;
            const isEmpty = !filters || Object.values(filters).every((v) => !v);
            setFilteredResults(isEmpty ? data : data.filter((item) => matchesFilters(item, filters)));
            setIsLoading(false);
        });
        return () => unsub();
    }, []); // no activeFilters dep — avoids re-subscribing on every filter change

    // ── Filter handlers ───────────────────────────────────────────────────────
    const onSubmit = useCallback((data) => {
        setActiveFilters(data);
        setFilteredResults(allResultsRef.current.filter((item) => matchesFilters(item, data)));
    }, []);

    const clearFilters = useCallback(() => {
        reset();
        setActiveFilters(null);
        setFilteredResults(allResultsRef.current);
    }, [reset]);

    // ── Excel Export ──────────────────────────────────────────────────────────
    const downloadExcel = useCallback(() => {
        if (!filteredResults.length) return;
        setIsDownloading(true);

        try {
            const exportData = filteredResults.map((item) => ({
                Type: item.type || "-",
                "Vehicle / Tanker": item.truckNumber || "-",
                Driver: item.driverName || "-",
                "Part Name": item.partName || "-",
                Notes: item.notes || "-",
                "Price (₹)": item.price ?? "-",
                "Service Charge (₹)": item.serviceCharge ?? "-",
                "Total Price (₹)": item.totalPrice ?? "-",
                Date: resolveDate(item),
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);

            // Auto column widths
            ws["!cols"] = Object.keys(exportData[0] || {}).map((key) => ({
                wch: Math.max(
                    key.length,
                    ...exportData.map((row) => String(row[key] ?? "").length)
                ) + 2,
            }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Maintenance Report");

            XLSX.writeFile(wb, `Maintenance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
        } finally {
            setIsDownloading(false);
        }
    }, [filteredResults]);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="report-container">
            <Sidebar />

            <div className="report-content">
                {/* Header */}
                <div className="report-header">
                    <div className="report-title-block">
                        <h2>Maintenance Reports</h2>
                        <span className="record-badge">{filteredResults.length} Records</span>
                    </div>

                    <button
                        className={`btn-download ${isDownloading ? "loading" : ""}`}
                        onClick={downloadExcel}
                        disabled={isDownloading || filteredResults.length === 0}
                        title="Download filtered data as Excel"
                    >
                        {isDownloading ? (
                            <><span className="spinner" /> Exporting…</>
                        ) : (
                            <><DownloadIcon /> Download Report</>
                        )}
                    </button>
                </div>

                {/* Filter Form */}
                <form className="filter-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="filter-group">
                        <label className="filter-label">Vehicle</label>
                        <select {...register("vehicle")}>
                            <option value="">All Vehicles</option>
                            {vehicles.map((v, i) => <option key={i} value={v}>{v}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Tanker</label>
                        <select {...register("tanker")}>
                            <option value="">All Tankers</option>
                            {tankers.map((t, i) => <option key={i} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">From Date</label>
                        <input type="date" {...register("startDate")} />
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">To Date</label>
                        <input type="date" {...register("endDate")} />
                    </div>

                    <div className="filter-actions">
                        <button type="submit" className="btn-filter">
                            <FilterIcon /> Apply
                        </button>
                        <button type="button" onClick={clearFilters} className="btn-clear">
                            ✕ Clear
                        </button>
                    </div>
                </form>

                {/* Table */}
                <div className="results-table">
                    {isLoading ? (
                        <div className="table-loader">
                            <div className="loader-bar" />
                            <p>Loading data…</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    {TABLE_HEADERS.map((h) => (
                                        <th key={h.key}>{h.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResults.length > 0 ? (
                                    filteredResults.map((item, i) => (
                                        <tr key={item.id || i}>
                                            <td>
                                                <span className="type-badge type-maintenance">
                                                    {item.type || "-"}
                                                </span>
                                            </td>
                                            <td>{item.truckNumber || "-"}</td>
                                            <td>{item.driverName || "-"}</td>
                                            <td>{item.partName || "-"}</td>
                                            <td className="notes-cell">{item.notes || "-"}</td>
                                            <td className="price-cell">
                                                {item.price != null ? `₹ ${item.price}` : "-"}
                                            </td>
                                            <td className="price-cell">
                                                {item.serviceCharge != null ? `₹ ${item.serviceCharge}` : "-"}
                                            </td>
                                            <td className="price-cell total">
                                                {item.totalPrice != null ? `₹ ${item.totalPrice}` : "-"}
                                            </td>
                                            <td className="date-cell">{resolveDate(item)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={TABLE_HEADERS.length} className="no-data">
                                            <EmptyIcon />
                                            <span>No maintenance records found.</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const FilterIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);

const EmptyIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
        <line x1="9" y1="11" x2="15" y2="11" />
    </svg>
);