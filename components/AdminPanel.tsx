
import React, { useState, useEffect } from 'react';
import { AdminDashboardData } from '../types';
import {
  Search, Download, RefreshCw, CheckCircle, XCircle, Clock,
  ExternalLink, Filter, LogOut, Loader2, LayoutDashboard, ShieldAlert, Lock, User as UserIcon, AlertTriangle
} from 'lucide-react';
import * as firebaseApp from 'firebase/app';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// ------------------------------------------------------------------
// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
import { GOOGLE_SCRIPT_URL, ALLOWED_ADMIN_EMAILS } from '../config';


// NOTE: Firebase Auth is imported from ../firebase.ts (Shared Instance)

const AdminPanel = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [dataLoading, setDataLoading] = useState(false);

  const [data, setData] = useState<AdminDashboardData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // AUTH STATE LISTENER
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (ALLOWED_ADMIN_EMAILS.includes(currentUser.email || "")) {
          setUser(currentUser);
          fetchData(); // Auto-fetch on login
        } else {
          setLoginError("Access Denied: You are not authorized.");
          // signOut(auth); // REMOVED: Don't logout, just show access denied. This allows the user to use the Registration form in another tab.
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // LOGIN HANDLER
  const handleGoogleLogin = async () => {
    if (!auth) {
      setLoginError("Firebase not configured. Please check code.");
      return;
    }
    setLoginError("");
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;

      if (!ALLOWED_ADMIN_EMAILS.includes(email || "")) {
        throw new Error("Email not authorized");
      }
      // Success is handled by onAuthStateChanged
    } catch (error: any) {
      console.error("Login Failed:", error);
      if (error.message.includes("not authorized")) {
        setLoginError("Access Denied: Your email is not on the admin list.");
      } else {
        setLoginError("Login failed. Check console or try again.");
      }
      await signOut(auth); // Ensure we don't leave a session for unauthorized users
      setAuthLoading(false);
    }
  };

  // LOGOUT HANDLER
  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    setData([]);
  };

  // FETCH DATA
  const fetchData = async () => {
    setDataLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?t=${new Date().getTime()}`);

      const text = await response.text();
      console.log("Raw Response:", text); // DEBUG

      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          // REMOVED LEGACY CHECK for _rowIndex. The new script does not return it.
          // if (json.length > 0 && typeof json[0]._rowIndex === 'undefined') { ... }

          setData(json);
        } else {
          console.error("Fetched data is not an array:", json);
          setFetchError("Received invalid data from server (not a list). See console.");
        }
      } catch (jsonError) {
        console.error("JSON Parse Error:", jsonError);
        setFetchError("Failed to parse server response. Check if URL is correct (is it the Web App URL?).");
      }

    } catch (error) {
      console.error("Failed to fetch data", error);
      setFetchError("Network error. Failed to connect to Google Script.");
    } finally {
      setDataLoading(false);
    }
  };

  // UPDATE STATUS
  const handleStatusUpdate = async (registrationId: string, newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;

    setUpdatingId(registrationId);
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "updateStatus",
          id: registrationId,
          status: newStatus
        })
      });

      // Optimistic update
      setData(prev => prev.map(item =>
        item["Registration ID"] === registrationId ? { ...item, "Status": newStatus } : item
      ));

    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const [sendingCertId, setSendingCertId] = useState<string | null>(null);

  // SEND CERTIFICATE
  const handleSendCertificate = async (registrationId: string) => {
    if (!confirm(`Are you sure you want to generate and email certificates for this team?`)) return;

    setSendingCertId(registrationId);
    try {
      // Use 'no-cors' mode if just triggering, but we want response so we'll try standard POST 
      // Note: 'no-cors' returns opaque response, so we won't know if it failed.
      // Since our script handles CORS (hopefully), we use normal fetch.
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "sendCertificate",
          id: registrationId
        })
      });

      const result = await response.json();
      if (result.result === 'success') {
        alert("Certificates sent successfully!");
      } else {
        alert("Failed to send: " + (result.message || result.error || "Unknown error"));
      }

    } catch (error) {
      console.error("Certificate generation failed", error);
      alert("Network error or script failure. Check console.");
    } finally {
      setSendingCertId(null);
    }
  };

  // CSV DOWNLOAD
  const downloadCSV = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header as keyof AdminDashboardData] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Hackathon_Registrations_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // FILTER LOGIC
  const filteredData = data.filter(item => {
    const matchesSearch =
      String(item["Team Name"] || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item["Leader Name"] || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item["Registration ID"] || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item["Status"] === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ------------------------------------------------------------------
  // RENDER: LOADING
  // ------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // RENDER: LOGIN SCREEN
  // ------------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center relative overflow-hidden">

          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-blue-500/10 rounded-full">
              <LayoutDashboard className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Organizer Admin</h1>
          <p className="text-gray-400 mb-8">Secure Access Portal</p>

          {loginError && (
            <div className="mb-6 flex items-center justify-center gap-2 text-red-300 text-sm bg-red-500/10 p-3 rounded border border-red-500/20">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26c.01-.01.01-.01.01-.01z" />
              <path fill="#EA4335" d="M12 4.63c1.61 0 3.06.56 4.21 1.64l3.16-3.16C17.45 1.14 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <p className="mt-6 text-xs text-gray-500">
            Authorized personnel only. All access attempts are logged.
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // RENDER: DASHBOARD
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-[1920px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600/10 p-2 rounded-lg border border-blue-500/20">
              <LayoutDashboard className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white">ADMIN <span className="text-blue-500">DASHBOARD</span></h1>
              <p className="text-xs text-gray-500 font-mono">CodeRush Config v2.1</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 text-sm bg-gray-900 border border-gray-800 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-300 font-medium">{user.email}</span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={fetchData} className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-700" title="Refresh Data">
                <RefreshCw className={`w-5 h-5 ${dataLoading ? 'animate-spin text-blue-500' : ''}`} />
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border border-red-500/20 hover:border-red-500/40">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 lg:p-10 max-w-[1920px] mx-auto">

        {/* Controls Bar */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 bg-gray-900/30 p-6 rounded-2xl border border-gray-800">
          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search team, leader..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none w-full md:w-80 transition-all shadow-inner"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter className="w-4 h-4 text-gray-500" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-10 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer w-full md:w-48 hover:border-gray-700 transition-colors"
              >
                <option value="All" className="bg-gray-900 py-2">All Status</option>
                <option value="Pending Verification" className="bg-gray-900 py-2">Pending</option>
                <option value="Verified" className="bg-gray-900 py-2">Verified</option>
                <option value="Rejected" className="bg-gray-900 py-2">Rejected</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full xl:w-auto justify-between xl:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Total Entries:</span>
              <span className="bg-gray-800 text-white px-3 py-1 rounded-md font-mono font-bold text-sm border border-gray-700">{filteredData.length}</span>
            </div>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-sm font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 transform hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-black/40 border-b border-gray-800 text-gray-400 text-xs font-bold uppercase tracking-widest">
                  <th className="px-8 py-5 w-[140px]">Status</th>
                  <th className="px-6 py-5 w-[120px]">Reg ID</th>
                  <th className="px-6 py-5 w-[200px]">Team Info</th>
                  <th className="px-6 py-5 w-[250px]">Leader Details</th>
                  <th className="px-6 py-5 w-[250px]">Member 2</th>
                  <th className="px-6 py-5 w-[140px]">Payment</th>
                  <th className="px-8 py-5 w-[200px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <tr key={row["Registration ID"]} className="hover:bg-blue-500/5 transition-colors group">
                      {/* STATUS */}
                      <td className="px-8 py-6 align-top">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm
                                            ${row["Status"] === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' :
                            row["Status"] === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10'}`}>
                          {row["Status"] === 'Verified' && <CheckCircle className="w-3.5 h-3.5" />}
                          {row["Status"] === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                          {row["Status"] === 'Pending Verification' && <Loader2 className="w-3.5 h-3.5 animate-spin-slow" />}
                          {row["Status"] === 'Pending Verification' ? 'Pending' : row["Status"]}
                        </span>
                      </td>

                      {/* REG ID */}
                      <td className="px-6 py-6 align-top">
                        <div className="font-mono text-sm text-blue-400 font-bold tracking-tight bg-blue-500/5 px-2 py-1 rounded inline-block border border-blue-500/10">
                          {row["Registration ID"]}
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(row["Timestamp"]).toLocaleDateString()}
                        </div>
                      </td>

                      {/* TEAM INFO */}
                      <td className="px-6 py-6 align-top">
                        <div className="font-bold text-white text-lg tracking-tight group-hover:text-blue-400 transition-colors">
                          {row["Team Name"]}
                        </div>
                      </td>

                      {/* LEADER */}
                      <td className="px-6 py-6 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-200 text-base">{row["Leader Name"]}</span>
                          <span className="text-xs font-mono text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded w-fit">{row["Leader USN"]}</span>
                          <span className="text-xs text-gray-400 mt-1">{row["Leader Branch"]} • Sem {row["Leader Sem"]}</span>
                          <a href={`tel:${row["Leader Phone"]}`} className="text-xs text-blue-400/80 hover:text-blue-400 mt-1 hover:underline w-fit">
                            {row["Leader Phone"]}
                          </a>
                        </div>
                      </td>

                      {/* MEMBER 2 */}
                      <td className="px-6 py-6 align-top">
                        {row["Member 2 Name"] ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-gray-200 text-base">{row["Member 2 Name"]}</span>
                            <span className="text-xs font-mono text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded w-fit">{row["Member 2 USN"]}</span>
                            <span className="text-xs text-gray-400 mt-1">{row["Member 2 Branch"]} • Sem {row["Member 2 Sem"]}</span>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-sm italic font-medium">--</span>
                        )}
                      </td>

                      {/* PAYMENT */}
                      <td className="px-6 py-6 align-top">
                        {row["Payment Screenshot URL"] && row["Payment Screenshot URL"] !== "No File Uploaded" ? (
                          <a
                            href={row["Payment Screenshot URL"]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-xs font-medium transition-all border border-gray-700 hover:border-gray-600"
                          >
                            <ExternalLink className="w-3 h-3" /> Screenshot
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/5 text-red-500/70 text-xs rounded-full border border-red-500/10">
                            <AlertTriangle className="w-3 h-3" /> Missing
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-8 py-6 align-top text-right">
                        <div className="flex flex-col gap-2 justify-end items-end">
                          {updatingId === row["Registration ID"] ? (
                            <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                              <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                            </div>
                          ) : (
                            <div className="relative inline-block w-40">
                              <select
                                disabled={updatingId === row["Registration ID"]}
                                className="w-full bg-gray-800 text-white text-xs font-medium px-3 py-2.5 rounded-lg border border-gray-700 
                                            hover:border-gray-600 hover:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer transition-all appearance-none"
                                value=""
                                onChange={(e) => handleStatusUpdate(row["Registration ID"], e.target.value)}
                              >
                                <option value="" className="bg-gray-900 text-gray-400">Update Status...</option>
                                <option value="Verified" className="bg-gray-900 text-green-400 font-bold">✓ Verified</option>
                                <option value="Rejected" className="bg-gray-900 text-red-400 font-bold">✗ Rejected</option>
                                <option value="Pending Verification" className="bg-gray-900 text-yellow-400 font-bold">○ Pending</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
                            </div>
                          )}

                          {/* Send Certificate Button - Only for Verified Users */}
                          {row["Status"] === "Verified" && (
                            <button
                              onClick={() => handleSendCertificate(row["Registration ID"])}
                              disabled={sendingCertId === row["Registration ID"]}
                              className="flex items-center justify-center gap-2 w-40 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 hover:text-purple-300 text-xs font-bold px-3 py-2.5 rounded-lg border border-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {sendingCertId === row["Registration ID"] ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" /> Sending...
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3 h-3" /> Send Cert
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-16 text-center text-gray-500">
                      {fetchError ? (
                        <div className="text-red-400 flex flex-col items-center gap-4 bg-red-500/5 p-8 rounded-2xl border border-red-500/10 max-w-md mx-auto">
                          <AlertTriangle className="w-10 h-10 opacity-50" />
                          <div>
                            <span className="font-bold text-lg block mb-1">Error Loading Data</span>
                            <span className="text-sm opacity-80">{fetchError}</span>
                          </div>
                          <button onClick={fetchData} className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded transition-colors">
                            Try Again
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          {dataLoading ? (
                            <>
                              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                              <span className="text-sm animate-pulse">Syncing with database...</span>
                            </>
                          ) : (
                            <>
                              <Search className="w-10 h-10 opacity-20" />
                              <p>No registrations found matching your filters.</p>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );

};

export default AdminPanel;
