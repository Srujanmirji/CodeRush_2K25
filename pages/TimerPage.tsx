import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FlipClock from '../components/FlipClock';
import { Play, Pause, RotateCcw, Settings, Check, Lock, LogOut, Timer as TimerIcon, Hourglass, X } from 'lucide-react';
import ThreeBackground from '../components/ThreeBackground';
import { database, auth, googleProvider } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ALLOWED_ADMIN_EMAILS } from '../config';

interface TimerState {
    isRunning: boolean;
    endTime: number;
    startTime: number;
    remaining: number;
    initialDuration: number;
    mode: 'countdown' | 'countup';
    status?: string;
}

const TimerPage = () => {
    // Timer State
    const [timeLeft, setTimeLeft] = useState(0);
    const [remoteState, setRemoteState] = useState<TimerState | null>(null);

    // Auth State
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    // Input UI
    const [inputHours, setInputHours] = useState('');
    const [inputMinutes, setInputMinutes] = useState('');
    const [inputSeconds, setInputSeconds] = useState('');
    const [statusInput, setStatusInput] = useState('');
    const [showControls, setShowControls] = useState(false);
    const [modeInput, setModeInput] = useState<'countdown' | 'countup'>('countdown');

    // --- AUTH ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser && currentUser.email && ALLOWED_ADMIN_EMAILS.includes(currentUser.email)) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
                setShowControls(false);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); }
    };
    const handleLogout = async () => { await signOut(auth); setShowControls(false); };

    // --- SYNC ---
    useEffect(() => {
        const timerRef = ref(database, 'timer');
        return onValue(timerRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setRemoteState(data);
                if (data.mode) setModeInput(data.mode);
                if (data.status) setStatusInput(data.status);
            }
        });
    }, []);

    // --- SOUNDS ---
    const [isMuted, setIsMuted] = useState(false);
    const tickAudio = React.useRef<HTMLAudioElement | null>(null);
    const alarmAudio = React.useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        tickAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
        alarmAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3');

        // Preload
        tickAudio.current.volume = 0.5;
        alarmAudio.current.volume = 0.8;
    }, []);

    const playTick = () => {
        if (!isMuted && tickAudio.current) {
            tickAudio.current.currentTime = 0;
            tickAudio.current.play().catch(e => console.log("Audio play failed", e));
        }
    };

    const playAlarm = () => {
        if (!isMuted && alarmAudio.current) {
            alarmAudio.current.currentTime = 0;
            alarmAudio.current.play().catch(e => console.log("Audio play failed", e));
        }
    };

    // --- TICK ---
    useEffect(() => {
        const interval = setInterval(() => {
            if (!remoteState) return;
            const now = Date.now();

            if (remoteState.mode === 'countup') {
                if (remoteState.isRunning && remoteState.startTime) {
                    setTimeLeft(Math.floor((now - remoteState.startTime) / 1000));
                } else {
                    setTimeLeft(remoteState.remaining || 0);
                }
            } else {
                if (remoteState.isRunning && remoteState.endTime) {
                    const remaining = Math.max(0, Math.ceil((remoteState.endTime - now) / 1000));
                    setTimeLeft(remaining);
                } else {
                    setTimeLeft(remoteState.remaining || 0);
                }
            }
        }, 100);
        return () => clearInterval(interval);
    }, [remoteState]);

    // Refined Sound Logic
    const lastTickRef = React.useRef<number>(-1);

    useEffect(() => {
        // Guard: Verify vital state exists
        if (!remoteState?.isRunning || remoteState?.mode !== 'countdown') {
            lastTickRef.current = -1;
            return;
        }

        // 1. Ticking (Last 10 seconds only)
        if (timeLeft <= 10 && timeLeft > 0) {
            if (timeLeft !== lastTickRef.current) {
                lastTickRef.current = timeLeft;
                playTick();
            }
        }

        // 2. Alarm (At 0)
        else if (timeLeft === 0) {
            if (lastTickRef.current === 1) { // Only play if we just transitioned from 1 -> 0
                lastTickRef.current = 0;
                playAlarm();
            }
        }

        // 3. Reset Ref for > 10s
        else {
            // Strictly NO sound here
            lastTickRef.current = timeLeft;
        }
    }, [timeLeft, remoteState, isMuted]);

    const isRunning = remoteState?.isRunning || false;

    // --- ACTIONS ---
    const handleSetTime = async () => {
        if (!isAdmin) return;
        if (modeInput === 'countdown') {
            const totalSeconds = (parseInt(inputHours) || 0) * 3600 + (parseInt(inputMinutes) || 0) * 60 + (parseInt(inputSeconds) || 0);
            await set(ref(database, 'timer'), {
                isRunning: false, endTime: 0, startTime: 0, remaining: totalSeconds, initialDuration: totalSeconds, mode: 'countdown', status: "READY TO START"
            });
        } else {
            await set(ref(database, 'timer'), {
                isRunning: false, endTime: 0, startTime: 0, remaining: 0, initialDuration: 0, mode: 'countup', status: "READY TO START"
            });
        }
    };

    const handleUpdateStatus = async (newStatus?: string) => {
        if (!isAdmin || !remoteState) return;
        const s = newStatus !== undefined ? newStatus : statusInput;
        await set(ref(database, 'timer'), { ...remoteState, status: s });
        if (newStatus) setStatusInput(newStatus);
    };

    const toggleTimer = async () => {
        if (!isAdmin || !remoteState) return;
        const now = Date.now();
        if (remoteState.isRunning) {
            // PAUSE
            const val = remoteState.mode === 'countup'
                ? Math.floor((now - remoteState.startTime) / 1000)
                : Math.max(0, Math.ceil((remoteState.endTime - now) / 1000));
            await set(ref(database, 'timer'), { ...remoteState, isRunning: false, remaining: val, status: "HACKING PAUSED" });
        } else {
            // START
            if (remoteState.mode === 'countup') {
                await set(ref(database, 'timer'), { ...remoteState, isRunning: true, startTime: now - ((remoteState.remaining || 0) * 1000), status: "HACKING IN PROGRESS" });
            } else {
                let end = remoteState.remaining > 0 ? now + (remoteState.remaining * 1000) : now + (remoteState.initialDuration * 1000);
                if (remoteState.remaining === 0 && remoteState.initialDuration === 0) end = 0; // Prevent loop if 0
                await set(ref(database, 'timer'), { ...remoteState, isRunning: true, endTime: end, remaining: remoteState.remaining || remoteState.initialDuration, status: "HACKING IN PROGRESS" });
            }
        }
    };

    const resetTimer = async () => {
        if (!isAdmin || !remoteState) return;
        await set(ref(database, 'timer'), {
            ...remoteState, isRunning: false, remaining: remoteState.mode === 'countup' ? 0 : remoteState.initialDuration, endTime: 0, startTime: 0, status: "READY TO START"
        });
    };

    // Auto-End Status
    useEffect(() => {
        if (remoteState?.isRunning && remoteState.mode === 'countdown' && timeLeft === 0 && remoteState.initialDuration > 0) {
            // Only admin triggers the DB update to avoid race conditions from multiple clients
            if (isAdmin && remoteState.status !== "TIME IS UP") {
                set(ref(database, 'timer'), { ...remoteState, isRunning: false, status: "TIME IS UP" });
            }
        }
    }, [timeLeft, remoteState, isAdmin]);

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="relative min-h-screen text-gray-100 bg-[#050507] overflow-hidden font-sans selection:bg-cyan-500/30">

            {/* 3D BG with Overlay */}
            <div className="fixed inset-0 z-0">
                <ThreeBackground />
                <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/80 via-transparent to-[#050507] pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>
            </div>

            <Navbar />

            <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">

                {/* Header Group */}
                <div className="text-center mb-16 relative group cursor-default">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-[0.2em] mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                        CODERUSH 2K25
                    </h2>

                    <div className="flex items-center justify-center gap-4 text-sm md:text-base font-mono text-gray-400 tracking-widest uppercase mb-6 opacity-80">
                        <span>Full-Stack Hackathon</span>
                        <span className="text-purple-500">•</span>
                        <span>Vibeathon</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white relative z-10 tracking-wider">
                        OFFICIAL EVENT TIM<span className="text-transparent bg-clip-text bg-gradient-to-t from-white to-gray-400">ER</span>
                    </h1>

                    {/* Decorative Line */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 shadow-[0_0_10px_#00f0ff]"></div>
                </div>

                {/* Clock */}
                <div className="mb-20 scale-75 md:scale-100 transform transition-transform duration-700 hover:scale-[1.02] flex flex-col items-center gap-12">
                    <FlipClock hours={hours} minutes={minutes} seconds={seconds} />

                    {/* Status Message */}
                    {remoteState?.status && (
                        <div className="animate-pulse">
                            <h2 className="text-3xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500 tracking-[0.2em] drop-shadow-[0_0_25px_rgba(0,240,255,0.4)] uppercase text-center">
                                {remoteState.status}
                            </h2>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="fixed bottom-0 w-full p-6 text-center z-10 bg-gradient-to-t from-black to-transparent">
                    <p className="text-gray-500 font-mono text-xs md:text-sm tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity">
                        Jain College of Engineering & Technology, Hubballi
                    </p>
                </div>

                {/* Admin Controls Button */}
                {!authLoading && (
                    <button
                        onClick={isAdmin ? () => setShowControls(!showControls) : handleLogin}
                        className={`
                            fixed bottom-8 right-8 p-4 rounded-full text-white transition-all duration-300 backdrop-blur-xl border border-white/10
                            shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 hover:scale-110 active:scale-95 group
                            ${isAdmin ? 'bg-white/5 hover:bg-white/10' : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30'}
                        `}
                    >
                        {isAdmin ? <Settings className={`w-6 h-6 text-cyan-400 ${showControls ? 'rotate-180' : ''} transition-transform duration-500`} /> : <Lock className="w-6 h-6 text-red-400" />}
                    </button>
                )}

                {/* Control Panel Panel */}
                <div className={`
                    fixed bottom-24 right-8 w-96 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]
                    transform transition-all duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) origin-bottom-right z-50
                    ${showControls && isAdmin ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}
                `}>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 basic-full">
                        <div className='flex items-center gap-2'>
                            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]"></div>
                            <h3 className="text-lg font-bold text-white tracking-wider">CONTROLS</h3>
                        </div>

                        {/* Mute Toggle */}
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-2 rounded-lg transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                            title="Toggle Sound"
                        >
                            {isMuted ? "🔇" : "🔊"}
                        </button>

                        <button onClick={handleLogout} className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1.5 px-2 py-1 hover:bg-red-500/10 rounded transition-colors">
                            Logout <LogOut className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Status Input */}
                        <div className="group relative">
                            <input
                                type="text"
                                value={statusInput}
                                onChange={(e) => setStatusInput(e.target.value)}
                                placeholder="Status Message"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all placeholder:text-gray-700"
                            />
                            <button
                                onClick={() => handleUpdateStatus()}
                                className="absolute right-2 top-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-500 p-1.5 rounded-lg transition-colors"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <span className="absolute -top-2 left-4 bg-[#0a0a0f] px-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider group-focus-within:text-cyan-400 transition-colors">Event Status</span>
                        </div>

                        {/* Presets */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleUpdateStatus("LUNCH BREAK")}
                                className="flex-1 py-2 text-[10px] font-bold uppercase bg-white/5 hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 border border-white/10 rounded-lg transition-all"
                            >
                                Lunch Break
                            </button>
                            <button
                                onClick={() => handleUpdateStatus("HACKING PAUSED")}
                                className="flex-1 py-2 text-[10px] font-bold uppercase bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 rounded-lg transition-all"
                            >
                                Force Pause
                            </button>
                        </div>
                        {/* Mode Switcher */}
                        <div className="bg-black/40 p-1.5 rounded-xl flex gap-1 border border-white/5">
                            {['countdown', 'countup'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setModeInput(m as any)}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-300
                                        ${modeInput === m
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                        }`}
                                >
                                    {m === 'countdown' ? 'Countdown' : 'Count Up'}
                                </button>
                            ))}
                        </div>

                        {/* Inputs */}
                        {modeInput === 'countdown' ? (
                            <div className="grid grid-cols-3 gap-3">
                                {[{ l: 'Hrs', v: inputHours, s: setInputHours }, { l: 'Mins', v: inputMinutes, s: setInputMinutes }, { l: 'Secs', v: inputSeconds, s: setInputSeconds }].map((f, i) => (
                                    <div key={i} className="group relative">
                                        <input
                                            type="number"
                                            value={f.v}
                                            onChange={(e) => f.s(e.target.value)}
                                            placeholder="00"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-center text-xl font-bold text-white focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all placeholder:text-gray-700"
                                        />
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#0a0a0f] px-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider group-focus-within:text-cyan-400 transition-colors">{f.l}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/5">
                                <Hourglass className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-50" />
                                <span className="text-xs text-gray-400 uppercase tracking-widest">Timer starts from 00:00:00</span>
                            </div>
                        )}

                        {/* Set Button */}
                        <button
                            onClick={handleSetTime}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-white rounded-xl font-bold uppercase text-xs tracking-[0.2em] transition-all group"
                        >
                            <span className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
                                {modeInput === 'countdown' ? 'Initialize Timer' : 'Reset & Ready'}
                            </span>
                        </button>

                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                        {/* Playback Controls */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={toggleTimer}
                                className={`
                                    flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg
                                    ${isRunning
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 shadow-red-500/10'
                                        : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 shadow-green-500/10'
                                    }
                                `}
                            >
                                {isRunning ? <><Pause className="w-4 h-4 fill-current" /> Pause</> : <><Play className="w-4 h-4 fill-current" /> Start</>}
                            </button>

                            <button
                                onClick={resetTimer}
                                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
                            >
                                <RotateCcw className="w-4 h-4" /> Reset
                            </button>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default TimerPage;
