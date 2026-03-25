import React, { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import Sidebar from "../../../Component/Sidebar/Sidebar";
import "./Report.css";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import * as XLSX from "xlsx";

// ─── Constants ───────────────────────────────────────────────────────────────
const COLLECTIONS = {
    trucks: "trucks",
    tankers: "tankers",
    truckFill: "truckFillOperations",
    tankerFill: "tankerFillOperations",
    pumpFill: "tankerFillOperationsPump",
};

const TABLE_HEADERS = [
    { label: "Type", key: "type" },
    { label: "Vehicle ID", key: "truckId" },
    { label: "Tanker ID", key: "tankerId" },
    { label: "Driver", key: "driverName" },
    { label: "Location", key: "_location" },
    { label: "KM Reading", key: "currentReading" },
    { label: "Fuel Qty (L)", key: "_fuelQty" },
    { label: "Date & Time", key: "_dateTime" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const resolveLocation = (item) =>
    item.location || item.source || item.pumpName || "-";

const resolveFuelQty = (item) =>
    item.filledQty ?? item.filledOil ?? item.capacity ?? "-";

const resolveDateTime = (item) => {
    if (item.createdAt?.toDate) return item.createdAt.toDate().toLocaleString();
    if (item.dateTime) return item.dateTime;
    if (item.dateReceived) return item.dateReceived;
    return "-";
};

const mapDocs = (snap, type) =>
    snap.docs.map((doc) => ({ id: doc.id, type, ...doc.data() }));

const matchesFilters = (item, filters) => {
    const { vehicle, tanker, startDate, endDate } = filters;
    const createdAt =
        item.createdAt?.toDate?.() || (item.createdAt ? new Date(item.createdAt) : null);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;

    return (
        (!vehicle || item.truckId === vehicle) &&
        (!tanker || item.tankerId === tanker) &&
        (!start || (createdAt && createdAt >= start)) &&
        (!end || (createdAt && createdAt <= end))
    );
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Report() {
    const { register, handleSubmit, reset } = useForm();

    const [vehicles, setVehicles] = useState([]);
    const [tankers, setTankers] = useState([]);
    const [allResults, setAllResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [activeFilters, setActiveFilters] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Keep latest allResults in a ref so listener callbacks stay fresh
    const allResultsRef = useRef([]);
    allResultsRef.current = allResults;

    const activeFiltersRef = useRef(null);
    activeFiltersRef.current = activeFilters;

    // ── Fetch vehicles & tankers (one-time listeners) ─────────────────────────
    useEffect(() => {
        const unsubV = onSnapshot(collection(db, COLLECTIONS.trucks), (snap) =>
            setVehicles(
                snap.docs.map((d) => d.data().truckId || d.data().truckNumber).filter(Boolean)
            )
        );
        const unsubT = onSnapshot(collection(db, COLLECTIONS.tankers), (snap) =>
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

    // ── Fetch fill operations (real-time) ─────────────────────────────────────
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        const [truckSnap, tankerSnap, pumpSnap] = await Promise.all([
            getDocs(collection(db, COLLECTIONS.truckFill)),
            getDocs(collection(db, COLLECTIONS.tankerFill)),
            getDocs(collection(db, COLLECTIONS.pumpFill)),
        ]);

        const combined = [
            ...mapDocs(truckSnap, "Truck Fill"),
            ...mapDocs(tankerSnap, "Vehicle Fill"),
            ...mapDocs(pumpSnap, "Tanker Fill"),
        ];

        setAllResults(combined);

        const filters = activeFiltersRef.current;
        const isEmpty = !filters || Object.values(filters).every((v) => !v);
        setFilteredResults(isEmpty ? combined : combined.filter((item) => matchesFilters(item, filters)));
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Subscribe once per collection; any change triggers a full re-fetch
        const unsubs = [
            onSnapshot(collection(db, COLLECTIONS.truckFill), refreshData),
            onSnapshot(collection(db, COLLECTIONS.tankerFill), refreshData),
            onSnapshot(collection(db, COLLECTIONS.pumpFill), refreshData),
        ];
        return () => unsubs.forEach((u) => u());
    }, [refreshData]);

    // ── Filter handlers ───────────────────────────────────────────────────────
    const onSubmit = useCallback(
        (data) => {
            setActiveFilters(data);
            setFilteredResults(allResultsRef.current.filter((item) => matchesFilters(item, data)));
        },
        []
    );

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
                "Vehicle ID": item.truckId || "-",
                "Tanker ID": item.tankerId || "-",
                Driver: item.driverName || "-",
                Location: resolveLocation(item),
                "KM Reading": item.currentReading || "-",
                "Fuel Qty (L)": resolveFuelQty(item),
                "Date & Time": resolveDateTime(item),
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);

            // Auto column widths
            const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
                wch: Math.max(
                    key.length,
                    ...exportData.map((row) => String(row[key] ?? "").length)
                ) + 2,
            }));
            ws["!cols"] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Fuel Report");

            const fileName = `Fuel_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } finally {
            setIsDownloading(false);
        }
    }, [filteredResults]);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="report-container">
            <Sidebar />

            <div className="report-content">
                {/* Header Row */}
                <div className="report-header">
                    <div className="report-title-block">
                        <h2>Fuel Filling & Reports</h2>
                        <span className="record-badge">{filteredResults.length} Records</span>
                    </div>

                    <button
                        className={`btn-download ${isDownloading ? "loading" : ""}`}
                        onClick={downloadExcel}
                        disabled={isDownloading || filteredResults.length === 0}
                        title="Download filtered data as Excel"
                    >
                        {isDownloading ? (
                            <>
                                <span className="spinner" />
                                Exporting…
                            </>
                        ) : (
                            <>
                                <DownloadIcon />
                                Download Report
                            </>
                        )}
                    </button>
                </div>

                {/* Filter Form */}
                <form className="filter-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="filter-group">
                        <label className="filter-label">Vehicle</label>
                        <select {...register("vehicle")}>
                            <option value="">All Vehicles</option>
                            {vehicles.map((v, i) => (
                                <option key={i} value={v}>{v}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Tanker</label>
                        <select {...register("tanker")}>
                            <option value="">All Tankers</option>
                            {tankers.map((t, i) => (
                                <option key={i} value={t}>{t}</option>
                            ))}
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
                                        <tr key={item.id || i} data-type={item.type}>
                                            <td>
                                                <span className={`type-badge type-${item.type?.replace(/\s+/g, "-").toLowerCase()}`}>
                                                    {item.type || "-"}
                                                </span>
                                            </td>
                                            <td>{item.truckId || "-"}</td>
                                            <td>{item.tankerId || "-"}</td>
                                            <td>{item.driverName || "-"}</td>
                                            <td>{resolveLocation(item)}</td>
                                            <td>{item.currentReading || "-"}</td>
                                            <td className="fuel-qty">{resolveFuelQty(item)}</td>
                                            <td className="date-cell">{resolveDateTime(item)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={TABLE_HEADERS.length} className="no-data">
                                            <EmptyIcon />
                                            <span>No records found for the selected filters.</span>
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

// ─── Inline SVG Icons (no extra deps) ─────────────────────────────────────────
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
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);