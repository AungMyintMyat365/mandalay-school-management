"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { fetchGAS } from "@/lib/api";
import { parseClassData, ClassData } from "@/lib/parser";
import styles from "../class.module.css";
import { CLASS_OPTIONS } from "@/lib/options";

export default function ClassPage({ params }: { params: { className: string } }) {
    const className = decodeURIComponent(params.className);
    const { data: session } = useSession();

    const [data, setData] = useState<ClassData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // selectedDate holds the string representation of the date
    const [selectedDate, setSelectedDate] = useState<string>("");

    // Track local changes to support cascading dropdowns and edits
    // Map: date -> studentName -> field -> value
    const [localState, setLocalState] = useState<Record<string, Record<string, any>>>({});

    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetchGAS<{ rawData: any[][] }>("getClassData", { className });
                if (res.rawData) {
                    const parsed = parseClassData(res.rawData);
                    setData(parsed);

                    // Set default selected date to latest one if available
                    if (parsed.dates.length > 0) {
                        setSelectedDate(parsed.dates[0].date);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [className]);

    // Combined Data: merges original data with local state for the UI
    const currentEntry = useMemo(() => {
        if (!data) return null;

        // Find existing entry
        const existing = data.dates.find(d => d.date === selectedDate);

        // If not found (new session), we create a mock one
        if (!existing) {
            return {
                date: selectedDate,
                rowStart: -1,
                rowEnd: -1,
                studentData: {}
            };
        }
        return existing;
    }, [data, selectedDate]);

    // Filtered Students (Coach specific)
    const filteredStudents = useMemo(() => {
        if (!data || !session?.user) return [];
        if (session.user.role === 'admin') return data.students;

        const coachName = session.user.name || "";
        return data.students.filter(s =>
            s.coach?.toLowerCase().includes(coachName.toLowerCase()) ||
            coachName.toLowerCase().includes(s.coach?.toLowerCase()?.replace("coach", "").trim() || "___")
        );
    }, [data, session]);

    const studentsByCoach = useMemo(() => {
        const groups: { coach: string, students: typeof filteredStudents }[] = [];
        let currentGroup: typeof groups[0] | null = null;

        filteredStudents.forEach(s => {
            const coachName = s.coach || "Unassigned";
            if (!currentGroup || currentGroup.coach !== coachName) {
                if (currentGroup) groups.push(currentGroup);
                currentGroup = { coach: coachName, students: [] };
            }
            currentGroup.students.push(s);
        });
        if (currentGroup) groups.push(currentGroup);
        return groups;
    }, [filteredStudents]);

    const handleChange = (student: string, field: string, value: string) => {
        setLocalState(prev => ({
            ...prev,
            [selectedDate]: {
                ...(prev[selectedDate] || {}),
                [student]: {
                    ...(prev[selectedDate]?.[student] || {}),
                    [field]: value
                }
            }
        }));
    };

    const getValue = (student: string, field: string) => {
        // Priority: localState[date][student][field] > currentEntry.studentData[student][field]
        const localVal = localState[selectedDate]?.[student]?.[field];
        if (localVal !== undefined) return localVal;

        // @ts-ignore
        return currentEntry?.studentData[student]?.[field] || "";
    };

    const handleNewSession = () => {
        const today = new Date();
        const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

        // Check if today already exists in dropdown
        if (data?.dates.some(d => d.date === formattedDate)) {
            setSelectedDate(formattedDate);
            return;
        }

        setSelectedDate(formattedDate);
    };

    const handleSave = async () => {
        if (!selectedDate || !data) return;
        setSaving(true);

        try {
            // Collect all data for the selected date
            const sessionData: Record<string, any> = {};

            filteredStudents.forEach(student => {
                sessionData[student.name] = {
                    specialization: getValue(student.name, 'specialization'),
                    level: getValue(student.name, 'level'),
                    finishedLessons: getValue(student.name, 'finishedLessons'),
                    homework: getValue(student.name, 'homework'),
                    performance: getValue(student.name, 'performance'),
                };
            });

            const payload = {
                className,
                date: selectedDate,
                rowStart: currentEntry?.rowStart ?? -1,
                data: sessionData
            };

            await fetchGAS("saveClassData", {}, "POST", payload);
            alert("Session saved successfully!");
        } catch (e: any) {
            console.error("Save error details:", e);
            alert(`Failed to save session: ${e.message || "Unknown error"}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className={styles.emptyState}>
            Loading Class Data...
        </div>
    );

    if (!data) return <div className={styles.emptyState}>Failed to load class data.</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>{className}</h1>
                    <p className={styles.subtitle}>
                        {session?.user.role === 'admin' ? "Admin Hub" : `Coach Dashboard: ${session?.user.name}`}
                    </p>
                </div>

                <div className={styles.controls}>
                    <div className={styles.dateSelector}>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>SESSION DATE:</span>
                        <select
                            className={styles.selectDate}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        >
                            {data.dates.map(d => (
                                <option key={d.date} value={d.date}>{d.date}</option>
                            ))}
                            {!data.dates.some(d => d.date === selectedDate) && selectedDate && (
                                <option value={selectedDate}>{selectedDate} (New)</option>
                            )}
                        </select>
                    </div>

                    <button onClick={handleNewSession} className={styles.newEntryBtn}>
                        + New Session
                    </button>

                    <button
                        onClick={handleSave}
                        className={styles.saveBtn}
                        disabled={saving || filteredStudents.length === 0}
                    >
                        {saving ? "Saving..." : "Save Session"}
                    </button>
                </div>
            </header>

            {filteredStudents.length === 0 ? (
                <div className={styles.emptyState}>
                    No students assigned to you in this class.
                </div>
            ) : (
                <div className={styles.section}>
                    <div className={styles.sessionHeader}>
                        <h3 className={styles.sessionTitle}>
                            Session Details: {selectedDate}
                            {currentEntry?.rowStart === -1 && <span className={styles.newBadge} style={{ marginLeft: '12px' }}>New</span>}
                        </h3>
                        {currentEntry?.rowStart !== -1 && (
                            <span className={styles.rowInfo}>Starting Row {currentEntry.rowStart + 1}</span>
                        )}
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ background: 'transparent', borderBottom: 'none' }}></th>
                                    {studentsByCoach.map((group, gIdx) => (
                                        <th
                                            key={gIdx}
                                            colSpan={group.students.length}
                                            style={{
                                                textAlign: 'center',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderLeft: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px 8px 0 0'
                                            }}
                                        >
                                            {group.coach}
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    <th>Field</th>
                                    {filteredStudents.map(student => (
                                        <th key={student.name} style={{ minWidth: '180px' }}>{student.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className={styles.labelCell}>Specialization</td>
                                    {filteredStudents.map(student => (
                                        <td key={student.name}>
                                            <select
                                                className={styles.select}
                                                value={getValue(student.name, 'specialization')}
                                                onChange={(e) => handleChange(student.name, 'specialization', e.target.value)}
                                            >
                                                <option value="" disabled>Select...</option>
                                                {CLASS_OPTIONS.specialization.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className={styles.labelCell}>Level</td>
                                    {filteredStudents.map(student => (
                                        <td key={student.name}>
                                            <select
                                                className={styles.select}
                                                value={getValue(student.name, 'level')}
                                                onChange={(e) => handleChange(student.name, 'level', e.target.value)}
                                            >
                                                <option value="" disabled>Select...</option>
                                                {CLASS_OPTIONS.level.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className={styles.labelCell}>Finished Lessons</td>
                                    {filteredStudents.map(student => {
                                        const currentSpec = getValue(student.name, 'specialization');
                                        const lessonOptions = CLASS_OPTIONS.getLessons(currentSpec);

                                        return (
                                            <td key={student.name}>
                                                <select
                                                    className={styles.select}
                                                    value={getValue(student.name, 'finishedLessons')}
                                                    onChange={(e) => handleChange(student.name, 'finishedLessons', e.target.value)}
                                                    disabled={lessonOptions.length === 0}
                                                >
                                                    <option value="" disabled>Select...</option>
                                                    {lessonOptions.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        );
                                    })}
                                </tr>
                                <tr>
                                    <td className={styles.labelCell}>Homework</td>
                                    {filteredStudents.map(student => (
                                        <td key={student.name}>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                value={getValue(student.name, 'homework')}
                                                onChange={(e) => handleChange(student.name, 'homework', e.target.value)}
                                                placeholder="e.g. Completed"
                                            />
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className={styles.labelCell}>Performance</td>
                                    {filteredStudents.map(student => (
                                        <td key={student.name}>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                value={getValue(student.name, 'performance')}
                                                onChange={(e) => handleChange(student.name, 'performance', e.target.value)}
                                                placeholder="1-10"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
