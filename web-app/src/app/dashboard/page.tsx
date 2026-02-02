"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ClassSelector from "../components/ClassSelector";
import styles from "./dashboard.module.css";
{/* eslint-disable-next-line @next/next/no-img-element */ }

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'black', color: 'white' }}>
                <div style={{ opacity: 0.7 }}>Loading Portal...</div>
            </div>
        );
    }

    const user = session?.user;

    return (
        <>
            <div className="mesh-bg" />
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.welcomeSection}>
                        <h1>Welcome, {user?.name?.split(' ')[0]}</h1>
                        <div className={styles.roleBadge}>
                            Role: <strong>{user?.role}</strong>
                        </div>
                    </div>
                </header>

                <div className={styles.grid}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>My Classes</h2>
                        {/* Pass router functionality or ensure ClassSelector handles it */}
                        <div style={{ flex: 1 }}>
                            <ClassSelector onSelectClass={(cls) => router.push(`/dashboard/class/${encodeURIComponent(cls)}`)} />
                        </div>
                    </div>

                    {user?.role === 'admin' && (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Admin Controls</h2>
                            <p className={styles.cardDescription}>
                                Manage system-wide settings, user accounts, and global class configurations.
                            </p>
                            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                                <button style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '14px',
                                    color: 'white',
                                    cursor: 'not-allowed',
                                    fontWeight: '600'
                                }}>Coming Soon</button>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button onClick={() => router.push('/api/auth/signout')} className={styles.signOutBtn}>
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
}
