
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
          // VERSION CHECK: V3 Script must return _rowIndex
          if (json.length > 0 && typeof json[0]._rowIndex === 'undefined') {
            setFetchError("ALERT: You are using the OLD Google Script code. Please copy the V3 code from 'google_apps_script.md' and deploy 'New Version' again.");
            return;
          }

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
  const handleStatusUpdate = async (rowIndex: number, newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;

    setUpdatingId(rowIndex.toString());
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "updateStatus",
          rowIndex: rowIndex,
          status: newStatus
        })
      });

      // Optimistic update
      setData(prev => prev.map(item =>
        item._rowIndex === rowIndex ? { ...item, "Status": newStatus } : item
      ));

    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setUpdatingId(null);
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
      item["Team Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item["Leader Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item["Registration ID"]?.toLowerCase().includes(searchTerm.toLowerCase());

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
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold tracking-wide">ADMIN DASHBOARD</h1>
            <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded">v2.1</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
              <UserIcon className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            <div className="h-6 w-px bg-gray-700 mx-2 hidden sm:block"></div>
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors" title="Refresh Data">
              <RefreshCw className={`w-5 h-5 ${dataLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search team, name, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-300 focus:outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Pending Verification">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Showing <span className="font-bold text-white">{filteredData.length}</span> entries
            </div>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Reg ID</th>
                  <th className="p-4 font-medium">Team Info</th>
                  <th className="p-4 font-medium">Leader Details</th>
                  <th className="p-4 font-medium">Member 2</th>
                  <th className="p-4 font-medium">Payment</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                            ${row["Status"] === 'Verified' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            row["Status"] === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                          {row["Status"] === 'Verified' && <CheckCircle className="w-3 h-3" />}
                          {row["Status"] === 'Rejected' && <XCircle className="w-3 h-3" />}
                          {row["Status"] === 'Pending Verification' && <Clock className="w-3 h-3" />}
                          {row["Status"]}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-sm text-blue-400 font-bold">
                        {row["Registration ID"]}
                        <div className="text-xs text-gray-600 font-normal mt-1">
                          {new Date(row["Timestamp"]).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white text-lg">{row["Team Name"]}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        <div className="font-bold text-white">{row["Leader Name"]}</div>
                        <div className="text-xs text-gray-500">{row["Leader USN"]}</div>
                        <div className="text-xs text-gray-500">{row["Leader Branch"]} • Sem {row["Leader Sem"]}</div>
                        <div className="text-xs text-gray-500 mt-1">{row["Leader Phone"]}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        {row["Member 2 Name"] ? (
                          <>
                            <div className="font-bold text-white">{row["Member 2 Name"]}</div>
                            <div className="text-xs text-gray-500">{row["Member 2 USN"]}</div>
                            <div className="text-xs text-gray-500">{row["Member 2 Branch"]} • Sem {row["Member 2 Sem"]}</div>
                          </>
                        ) : (
                          <span className="text-gray-600 italic">No Member</span>
                        )}
                      </td>
                      <td className="p-4">
                        {row["Payment Screenshot URL"] && row["Payment Screenshot URL"] !== "No File Uploaded" ? (
                          <a
                            href={row["Payment Screenshot URL"]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline text-xs"
                          >
                            <ExternalLink className="w-3 h-3" /> View Screenshot
                          </a>
                        ) : (
                          <span className="text-gray-600 text-xs">No Upload</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          {updatingId === row._rowIndex?.toString() ? (
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Updating</span>
                          ) : (
                            <div className="flex bg-gray-800 rounded border border-gray-700 overflow-hidden">
                              <select
                                disabled={updatingId === row._rowIndex?.toString()}
                                className="bg-transparent text-xs px-3 py-2 outline-none cursor-pointer hover:bg-white/5 transition-colors disabled:opacity-50"
                                value=""
                                onChange={(e) => handleStatusUpdate(row._rowIndex!, e.target.value)}
                              >
                                <option value="">Change Status...</option>
                                <option value="Verified">Verified</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Pending Verification">Pending</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {fetchError ? (
                        <div className="text-red-400 flex flex-col items-center gap-2">
                          <AlertTriangle className="w-6 h-6" />
                          <span className="font-bold">Error Loading Data</span>
                          <span className="text-sm">{fetchError}</span>
                          <span className="text-xs bg-gray-800 p-2 rounded mt-2 font-mono">Check console (F12) for raw response.</span>
                        </div>
                      ) : (
                        dataLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : "No registrations found matching your filters."
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
