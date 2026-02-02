"use client";

import { useState, useEffect } from "react";
import { fetchGAS } from "@/lib/api";
import styles from "./ClassSelector.module.css"; // We'll create this or use inline for now

// Tabs to ignore
const IGNORED_TABS = [
    "Instruction Guide", "Campus Data", "Coders' Data",
    "Point Rewards", "Point Data", "Assessment Data",
    "Drop & Postpone", "Achievement Done",
    "Coach Name", "Coaches Account"
];

interface ClassSelectorProps {
    onSelectClass: (className: string) => void;
    selectedClass?: string;
}

export default function ClassSelector({ onSelectClass, selectedClass }: ClassSelectorProps) {
    const [classes, setClasses] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadClasses() {
            try {
                const res = await fetchGAS<{ sheets: string[] }>("getMetadata");
                if (res.sheets) {
                    const classTabs = res.sheets.filter(s => !IGNORED_TABS.includes(s));
                    setClasses(classTabs);
                }
            } catch (err) {
                setError("Failed to load classes");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadClasses();
    }, []);

    if (loading) return <div className={styles.loading}>Loading classes...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.grid}>
            {classes.map((cls) => (
                <button
                    key={cls}
                    onClick={() => onSelectClass(cls)}
                    className={`${styles.card} ${selectedClass === cls ? styles.selected : ''}`}
                >
                    {cls}
                </button>
            ))}
        </div>
    );
}
