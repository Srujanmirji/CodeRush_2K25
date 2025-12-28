import React, { useState, useEffect } from 'react';
import {
    Search, CheckCircle, Clock, ShieldCheck, User, Users, Phone, MapPin,
    LogOut, AlertTriangle, Loader2
} from 'lucide-react';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { auth, googleProvider, database } from '../firebase';
import { GOOGLE_SCRIPT_URL, ALLOWED_ADMIN_EMAILS } from '../config';
import SpinWheel from '../components/SpinWheel';
import ThreeBackground from '../components/ThreeBackground';

interface RegistrationData {
    "Registration ID": string;
    "Team Name": string;
    "Leader Name": string;
    "Leader USN": string;
    "Leader Phone": string;
    "Member 2 Name"?: string;
    "Member 2 USN"?: string;
    "Status": string; // from Sheet
    [key: string]: any;
}

interface FirebaseData {
    checkedIn: boolean;
    assignedDomain?: string;
    checkInTime?: number;
}

const RegistrationDesk = () => {
    // Auth
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [error, setError] = useState("");

    // Data
    const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
    const [firebaseData, setFirebaseData] = useState<Record<string, FirebaseData>>({});
    const [loadingData, setLoadingData] = useState(false);

    // UI State
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTeam, setSelectedTeam] = useState<RegistrationData | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);

    // --- AUTH ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u && ALLOWED_ADMIN_EMAILS.includes(u.email || "")) {
                setUser(u);
                fetchRegistrations();
            } else {
                setUser(null);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (e) {
            console.error(e);
            setError("Login Failed");
        }
    };

    // --- DATA ---
    const fetchRegistrations = async () => {
        setLoadingData(true);
        try {
            // 1. Fetch Sheet Data
            const res = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setRegistrations(data);
            }

            // 2. Sync Firebase Overlay
            const regRef = ref(database, 'registrations');
            onValue(regRef, (snapshot) => {
                const val = snapshot.val();
                if (val) setFirebaseData(val);
            });

        } catch (e) {
            console.error("Fetch Error", e);
            setError("Failed to load registration data.");
        } finally {
            setLoadingData(false);
        }
    };

    // --- ACTIONS ---
    const getFirebaseInfo = (id: string): FirebaseData => firebaseData[id] || { checkedIn: false };

    const [updatingCheckIn, setUpdatingCheckIn] = useState(false);

    // Helper to check if team is checked in (based on Sheet Status OR Firebase overlay)
    const isCheckedIn = (team: RegistrationData) => {
        return team["Status"] === "Checked In" || getFirebaseInfo(team["Registration ID"]).checkedIn;
    };

    const handleCheckIn = async () => {
        if (!selectedTeam) return;
        setUpdatingCheckIn(true);

        const id = selectedTeam["Registration ID"];

        try {
            console.log("Sending Check-In Request:", {
                url: GOOGLE_SCRIPT_URL,
                action: "eventCheckIn",
                id: id
            });

            // Update Google Sheet via Script
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({
                    action: "eventCheckIn",
                    id: id,
                    timestamp: new Date().toLocaleString()
                })
            });

            // Optimistic Update locally
            const updatedTeam = { ...selectedTeam, "Status": "Checked In" };
            setRegistrations(prev => prev.map(r => r["Registration ID"] === id ? updatedTeam : r));
            setSelectedTeam(updatedTeam);

            // Also sync to Firebase just in case (for Realtime consistency if allowed)
            // But main source is now Sheet
            const current = getFirebaseInfo(id);
            set(ref(database, `registrations/${id}`), {
                ...current,
                checkedIn: true,
                checkInTime: Date.now()
            }).catch(err => console.warn("Firebase sync failed (non-critical)", err));

        } catch (e) {
            console.error("Check-in failed", e);
            alert("Check-in failed. Check console.");
        } finally {
            setUpdatingCheckIn(false);
        }
    };

    const [pendingDomain, setPendingDomain] = useState<string | null>(null);
    const [updatingDomain, setUpdatingDomain] = useState(false);

    // Reset spin state when opening a new team
    useEffect(() => {
        setPendingDomain(null);
        setIsSpinning(false);
    }, [selectedTeam]);

    const handleSpin = () => {
        if (!selectedTeam || isSpinning) return;
        setPendingDomain(null);
        setIsSpinning(true);
    };

    const handleSpinEnd = (domain: string) => {
        setIsSpinning(false);
        setPendingDomain(domain);
    };

    const confirmDomain = async () => {
        if (!selectedTeam || !pendingDomain) return;
        setUpdatingDomain(true);

        const id = selectedTeam["Registration ID"];
        const current = getFirebaseInfo(id);
        const domain = pendingDomain;

        // Timeout protection
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 5000));

        try {
            // Optimistic Update (Immediate UI Switch)
            setFirebaseData(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    assignedDomain: domain
                }
            }));

            // 1. Save to Google Sheet (Primary for Data Persistence)
            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({
                    action: "updateDomain",
                    id: id,
                    domain: domain
                })
            }).catch(e => console.error("Sheet Domain Sync Failed", e));

            // 2. Save Domain to Firebase (Primary for Realtime UI)
            await Promise.race([
                set(ref(database, `registrations/${id}`), {
                    ...current,
                    assignedDomain: domain
                }),
                timeout
            ]);

            setPendingDomain(null);
            // alert(`🎯 Assigned Domain: ${domain}`); // Removed alert for smoother flow

        } catch (e: any) {
            console.error("Domain assignment failed", e);
            let msg = "Assignment failed. ";
            if (e.message === "Request timed out") {
                // Determine if we should treat it as success? 
                // Since Sheet is fire-and-forget, maybe we just assume it worked? 
                // No, let's warn.
                msg += "Network timeout. Check connection.";
            }
            else msg += e.message;
            alert(msg);
        } finally {
            setUpdatingDomain(false);
        }
    };

    const handleResetDomain = async () => {
        if (!selectedTeam) return;
        if (!confirm("Are you sure you want to RESET the domain? This will allow re-spinning.")) return;

        const id = selectedTeam["Registration ID"];
        const current = getFirebaseInfo(id);

        try {
            // Optimistic Update
            setFirebaseData(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    assignedDomain: undefined
                }
            }));

            // 1. Google Sheets (Clear value)
            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({
                    action: "updateDomain",
                    id: id,
                    domain: "" // Clear it
                })
            });

            // 2. Firebase
            await set(ref(database, `registrations/${id}/assignedDomain`), null);

        } catch (e) {
            console.error("Reset failed", e);
            alert("Reset failed");
        }
    };

    // --- RENDER ---
    const filteredTeams = registrations.filter(r =>
        (r["Team Name"] || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r["Leader Name"] || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r["Registration ID"] || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
                <ThreeBackground />
                <div className="z-10 bg-gray-900/80 p-8 rounded-2xl border border-white/10 backdrop-blur text-center max-w-md w-full">
                    <ShieldCheck className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Registration Desk</h1>
                    <p className="text-gray-400 mb-6">Authorized Volunteers Only</p>
                    {error && <p className="text-red-400 mb-4 bg-red-500/10 p-2 rounded">{error}</p>}
                    <button onClick={handleLogin} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">
                        Access Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentValues = selectedTeam ? getFirebaseInfo(selectedTeam["Registration ID"]) : null;
    const teamCheckedIn = selectedTeam ? isCheckedIn(selectedTeam) : false;

    return (
        <div className="flex flex-col h-screen bg-[#050507] text-white overflow-hidden font-sans">
            {/* Header */}
            <header className="flex-none h-16 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-6 z-20">
                <div>
                    <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                        CodeRush 2K25 <span className="text-gray-500 mx-2">|</span> <span className="text-white font-normal">Registration Desk</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-xs text-gray-500 font-mono hidden md:block">LoggedIn: {user.email}</p>
                    <button onClick={() => signOut(auth)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* LEFT PANEL: LIST */}
                <div className="w-1/3 min-w-[350px] border-r border-white/5 bg-[#0a0a0f]/50 backdrop-blur flex flex-col">
                    <div className="p-4 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search Team, ID, or Name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-cyan-500/50 outline-none text-white placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {loadingData ? (
                            <div className="text-center py-10 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading Data...</div>
                        ) : filteredTeams.length === 0 ? (
                            <div className="text-center py-10 text-gray-600">No teams found</div>
                        ) : (
                            filteredTeams.map(team => {
                                const fbInfo = getFirebaseInfo(team["Registration ID"]);
                                const isSelected = selectedTeam?.["Registration ID"] === team["Registration ID"];
                                const hasCheckedIn = isCheckedIn(team);

                                return (
                                    <div
                                        key={team["Registration ID"]}
                                        onClick={() => setSelectedTeam(team)}
                                        className={`
                                            p-4 rounded-xl cursor-pointer border transition-all duration-200
                                            ${isSelected
                                                ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                                : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-bold ${isSelected ? 'text-cyan-400' : 'text-white'}`}>{team["Team Name"]}</h3>
                                            <span className="text-[10px] font-mono text-gray-500 bg-black/40 px-1.5 py-0.5 rounded">
                                                {team["Registration ID"]}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 mb-2">{team["Leader Name"]} {team["Member 2 Name"] && `+ 1`}</div>

                                        <div className="flex gap-2">
                                            {hasCheckedIn && (
                                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> In
                                                </span>
                                            )}
                                            {fbInfo.assignedDomain && (
                                                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold truncate max-w-[120px]">
                                                    {fbInfo.assignedDomain}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: DETAILS */}
                <div className="flex-1 overflow-y-auto bg-[#050507] p-8">
                    {selectedTeam ? (
                        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Header Card */}
                            <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/10 transition-colors duration-700"></div>

                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Team Profile</div>
                                        <h2 className="text-4xl font-bold text-white mb-2">{selectedTeam["Team Name"]}</h2>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Reg: {selectedTeam["Timestamp"]?.split('T')[0]}</span>
                                            <span className={`flex items-center gap-1 font-bold ${selectedTeam["Status"] === 'Verified' ? 'text-green-500' : 'text-yellow-500'}`}>
                                                {selectedTeam["Status"] === 'Verified' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                                {selectedTeam["Status"]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-5xl font-mono font-bold text-white/10">{selectedTeam["Registration ID"].split('-')[1] || '000'}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase mb-2">
                                            <User className="w-4 h-4" /> Team Lead
                                        </div>
                                        <div className="text-lg font-bold text-white">{selectedTeam["Leader Name"]}</div>
                                        <div className="text-sm text-gray-400 font-mono">{selectedTeam["Leader USN"]}</div>
                                        <div className="text-xs text-gray-500 mt-1">{selectedTeam["Leader Phone"]}</div>
                                    </div>
                                    {selectedTeam["Member 2 Name"] && (
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase mb-2">
                                                <Users className="w-4 h-4" /> Member 2
                                            </div>
                                            <div className="text-lg font-bold text-white">{selectedTeam["Member 2 Name"]}</div>
                                            <div className="text-sm text-gray-400 font-mono">{selectedTeam["Member 2 USN"]}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ACTION ZONE */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Check In */}
                                <div className="bg-[#0a0a0f] p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-green-500" /> Event Check-In
                                    </h3>

                                    {teamCheckedIn ? (
                                        <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-8 py-4 rounded-2xl">
                                            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                                            <div className="font-bold">Checked In</div>
                                            <div className="text-xs opacity-70">
                                                {/* Timestamp usually not in sheet status, so just show status */}
                                                Confirmed Presence
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleCheckIn}
                                            disabled={updatingCheckIn}
                                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {updatingCheckIn ? <Loader2 className="animate-spin w-5 h-5" /> : "Confirm Check-In"}
                                        </button>
                                    )}
                                </div>

                                {/* DOMAIN */}
                                <div className="bg-[#0a0a0f] p-6 rounded-3xl border border-white/10 flex flex-col items-center">
                                    {currentValues?.assignedDomain ? (
                                        <div className="text-center w-full h-full flex flex-col items-center justify-center">
                                            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Assigned Domain</div>
                                            <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 py-2">
                                                {currentValues.assignedDomain}
                                            </div>
                                            <div className="mt-4 p-2 bg-white/5 rounded-lg border border-white/10 w-full text-center text-xs text-gray-500 flex justify-between items-center px-4">
                                                <span>Domain Locked</span>
                                                <button
                                                    onClick={handleResetDomain}
                                                    className="text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <SpinWheel spinning={isSpinning} onSpinEnd={handleSpinEnd} />

                                            {pendingDomain ? (
                                                <div className="mt-6 w-full animate-in fade-in slide-in-from-bottom-2">
                                                    <div className="text-center mb-4">
                                                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Result</div>
                                                        <div className="text-2xl font-bold text-white">{pendingDomain}</div>
                                                    </div>
                                                    <button
                                                        onClick={confirmDomain}
                                                        disabled={updatingDomain}
                                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {updatingDomain ? <Loader2 className="animate-spin w-5 h-5" /> : "Confirm Assignment"}
                                                    </button>
                                                    <button
                                                        onClick={() => setPendingDomain(null)}
                                                        disabled={updatingDomain}
                                                        className="mt-2 w-full py-2 text-xs text-gray-500 hover:text-white transition-colors"
                                                    >
                                                        Discard & Spin Again
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={handleSpin}
                                                    disabled={isSpinning || !teamCheckedIn}
                                                    className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {isSpinning ? "Spinning..." : "Spin for Domain"}
                                                </button>
                                            )}

                                            {!teamCheckedIn && !pendingDomain && (
                                                <p className="text-xs text-red-400 mt-2">Check-in required to spin</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600">
                            <Users className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg">Select a team from the list to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegistrationDesk;
