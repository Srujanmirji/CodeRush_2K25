
import React, { useState, useRef, useEffect } from 'react';
import { TeamRegistration, AdminDashboardData } from '../types';
import { Loader2, CheckCircle, AlertTriangle, User, Users, CreditCard, Coffee, Upload, QrCode, ArrowLeft, ArrowRight, X, IdCard, LogIn, LogOut, Lock } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
import { GOOGLE_SCRIPT_URL } from '../config';

// Removed hardcoded URL


const REGISTRATION_FEE = 100; // INR
const UPI_ID = "srujanmirji10@oksbi"; // Replace with actual UPI ID

// CONSTANTS FOR DROPDOWNS
const BRANCHES = ['CSE', 'AIML', 'ECE', 'CV', 'ME'];
const SEMESTERS = [1, 3, 5, 7];

const RegistrationForm = () => {
  // Step 1: Details, Step 2: Payment/Upload
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState<TeamRegistration>({
    teamName: '',
    leaderName: '',
    leaderPhone: '',
    leaderEmail: '',
    leaderSemester: '',
    leaderBranch: '',
    leaderUSN: '',
    member2Name: '',
    member2Phone: '',
    member2Email: '',
    member2Semester: '',
    member2Branch: '',
    member2USN: '',
  });

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [registrationId, setRegistrationId] = useState('');

  // ------------------------------------------------------------------
  // AUTH STATE
  // ------------------------------------------------------------------
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth State Changed:", currentUser ? currentUser.email : "Logged Out");
      setUser(currentUser);
      if (currentUser) {
        // Auto-fill email
        setFormData(prev => ({ ...prev, leaderEmail: currentUser.email || '' }));
        checkRegistrationStatus(currentUser.email);
      } else {
        setAuthLoading(false);
        setAlreadyRegistered(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkRegistrationStatus = async (email: string | null) => {
    if (!email) return;
    setCheckingRegistration(true);
    try {
      // Fetch directly from Google Sheets (Persistent Data)
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const data: AdminDashboardData[] = await response.json();

      if (Array.isArray(data)) {
        // Check if email exists in "Leader Email" or "Member 2 Email" (optional, but requested 1 google account = 1 unique registration)
        const isRegistered = data.some(row =>
          (row["Leader Email"] && row["Leader Email"].toLowerCase() === email.toLowerCase()) ||
          (row["Member 2 Email"] && row["Member 2 Email"].toLowerCase() === email.toLowerCase())
        );

        if (isRegistered) {
          setAlreadyRegistered(true);
        }
      }
    } catch (error) {
      console.error("Failed to check registration status", error);
      // Fail safely: Let them try, if backend rejects it's fine, but ui won't block.
    } finally {
      setCheckingRegistration(false);
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log("Starting Google Sign In...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Sign In Success:", result.user.email);
    } catch (error) {
      console.error("Login Failed", error);
      alert("Login Failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setFormData(prev => ({ ...prev, leaderEmail: '' }));
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(formContainerRef.current, {
        scrollTrigger: {
          trigger: formContainerRef.current,
          start: "top 85%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });
    }, formContainerRef);
    return () => ctx.revert();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate File Type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setStatus('error');
        setMessage('Invalid file type. Only JPG, JPEG, and PNG are allowed.');
        return;
      }

      // Validate File Size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setStatus('error');
        setMessage('File size too large. Max 10MB.');
        return;
      }

      setScreenshotFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStatus('idle');
      setMessage('');
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setStatus('error');
      setMessage('You must agree to the Rules & Eligibility to proceed.');
      return;
    }
    setStatus('idle');
    setStep(2);
  };

  // Helper: Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the Data-URI prefix to get raw base64
        const result = reader.result as string;
        // The robust script also handles cleanup, but better to be safe
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFinalSubmit = async () => {
    if (!screenshotFile) {
      setStatus('error');
      setMessage('Please upload the payment screenshot.');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('Uploading Proof & Registering...');

    try {
      // 1. Convert Image to Base64
      const imageBase64 = await fileToBase64(screenshotFile);

      // 2. Prepare Payload
      const payload = {
        ...formData,
        leaderEmail: user?.email || formData.leaderEmail, // Ensure authenticated email is used
        imageBase64: imageBase64,
        imageMimeType: screenshotFile.type,
        action: 'register'
      };

      // 3. Send to Google Sheets with Timeout Safety
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for large uploads

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify(payload),
          mode: 'no-cors',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        // Success Assumption (no-cors limitation)
        setLoading(false);
        setStatus('success');
        setRegistrationId(`HTF-${Math.floor(1000 + Math.random() * 9000)}`);
        setMessage('Registration Submitted Successfully!');

      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error("Upload timed out. Please try a smaller image.");
        }
        throw err;
      }

    } catch (error: any) {
      console.error(error);
      setLoading(false);
      setStatus('error');
      setMessage(error.message || 'Registration failed. Check connection.');
    }
  };

  // SUCCESS STATE
  if (status === 'success') {
    return (
      <div className="w-full max-w-lg mx-auto p-8 rounded-2xl bg-cyber-black/80 border border-cyber-blue backdrop-blur-xl text-center shadow-[0_0_50px_rgba(0,240,255,0.2)] animate-in fade-in zoom-in duration-500 hover:scale-[1.02] hover:shadow-[0_0_80px_rgba(0,240,255,0.4)] transition-all">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-xl opacity-50 rounded-full"></div>
            <CheckCircle className="relative w-20 h-20 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
          </div>
        </div>
        <h3 className="text-3xl font-display font-bold text-white mb-2">SUBMISSION RECEIVED</h3>
        <p className="text-gray-300 font-sans mb-6 text-lg">{message}</p>
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyber-blue"></div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Reference ID</p>
          <p className="text-3xl font-mono text-cyber-blue tracking-wider font-bold group-hover:text-white transition-colors">{registrationId}</p>
          <p className="text-xs text-gray-500 mt-2">Payment Verification Pending</p>
        </div>
        <button
          onClick={() => {
            setStatus('idle');
            setStep(1);
            setScreenshotFile(null);
            setPreviewUrl(null);
            setFormData({
              teamName: '', leaderName: '', leaderPhone: '', leaderEmail: '', leaderSemester: '', leaderBranch: '', leaderUSN: '',
              member2Name: '', member2Phone: '', member2Email: '', member2Semester: '', member2Branch: '', member2USN: ''
            });
            setAgreed(false);
          }}
          className="px-8 py-3 bg-transparent border border-gray-500 text-gray-300 hover:text-white hover:border-cyber-blue hover:bg-cyber-blue/10 rounded uppercase tracking-wider transition-all duration-300"
        >
          Register Another Team
        </button>
      </div>
    );
  }

  // AUTH LOADING STATE
  if (authLoading || checkingRegistration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-cyber-blue mb-4" />
        <p className="font-mono animate-pulse">Authenticating...</p>
      </div>
    );
  }

  // NOT LOGGED IN STATE
  if (!user) {
    return (
      <div className="w-full max-w-lg mx-auto p-8 rounded-2xl bg-cyber-black/80 border border-cyber-blue/30 backdrop-blur-xl text-center shadow-[0_0_50px_rgba(0,240,255,0.1)] animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-cyber-blue/10 rounded-full border border-cyber-blue/30 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Lock className="w-12 h-12 text-cyber-blue" />
          </div>
        </div>
        <h3 className="text-2xl font-display font-bold text-white mb-3">AUTHENTICATION REQUIRED</h3>
        <p className="text-gray-400 font-sans mb-8 leading-relaxed">
          To ensure fair participation and prevent spam, please sign in with your Google account to proceed with registration.
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-4 bg-white text-black font-bold text-lg rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26c.01-.01.01-.01.01-.01z" />
            <path fill="#EA4335" d="M12 4.63c1.61 0 3.06.56 4.21 1.64l3.16-3.16C17.45 1.14 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  // ALREADY REGISTERED STATE
  if (alreadyRegistered) {
    return (
      <div className="w-full max-w-lg mx-auto p-8 rounded-2xl bg-cyber-black/80 border border-yellow-500/50 backdrop-blur-xl text-center shadow-[0_0_50px_rgba(234,179,8,0.1)] animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/30">
            <CheckCircle className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
        <h3 className="text-2xl font-display font-bold text-white mb-2">ALREADY REGISTERED</h3>
        <p className="text-gray-300 mb-6">
          The email <span className="text-cyber-blue font-mono">{user.email}</span> is already associated with a registered team.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogout}
            className="px-6 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-white rounded transition-colors text-sm"
          >
            Sign out and try another account
          </button>
        </div>
      </div>
    );
  }

  // FORM RENDER
  return (
    <div ref={formContainerRef} className="w-full max-w-4xl mx-auto relative z-10 transition-transform duration-500 group">
      <div className="bg-cyber-glass backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl transition-all duration-500 group-hover:shadow-[0_0_50px_rgba(0,240,255,0.1)] hover:scale-[1.005]">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-full flex justify-end items-center gap-3 mb-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Logged in as</p>
              <p className="text-xs text-cyber-blue font-mono bg-cyber-blue/10 px-2 py-1 rounded border border-cyber-blue/20">{user?.email}</p>
            </div>
            <button onClick={handleLogout} title="Sign Out" className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors border border-white/5 hover:border-red-500/30">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6 tracking-tight">INITIALIZE REGISTRATION</h2>

          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-1 rounded-full text-sm font-mono border ${step === 1 ? 'bg-cyber-blue/20 border-cyber-blue text-cyber-blue' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
              <span className="font-bold">01</span> DETAILS
            </div>
            <div className="w-8 h-px bg-gray-700"></div>
            <div className={`flex items-center gap-2 px-4 py-1 rounded-full text-sm font-mono border ${step === 2 ? 'bg-cyber-pink/20 border-cyber-pink text-cyber-pink' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
              <span className="font-bold">02</span> PAYMENT
            </div>
          </div>
        </div>

        {status === 'error' && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded flex items-center gap-3 text-red-200 animate-pulse">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {step === 1 ? (
          // ----------------------------------------------------------------
          // STEP 1: TEAM DETAILS
          // ----------------------------------------------------------------
          <form onSubmit={handleNextStep} className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* SECTION 1: TEAM */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-4">
                <Users className="w-5 h-5 text-cyber-pink" />
                <h3 className="text-xl font-display text-white tracking-wide">TEAM DETAILS</h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">Team Name</label>
                  <input
                    required
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleChange}
                    type="text"
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all placeholder-gray-600"
                    placeholder="e.g. Binary Bandits"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: TEAM LEADER */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-4">
                <User className="w-5 h-5 text-cyber-blue" />
                <h3 className="text-xl font-display text-white tracking-wide">TEAM LEADER <span className="text-xs text-gray-500 font-sans normal-case ml-2">(Primary Contact)</span></h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">Full Name</label>
                  <input
                    required
                    name="leaderName"
                    value={formData.leaderName}
                    onChange={handleChange}
                    type="text"
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all"
                    placeholder="Team Leader Name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">Phone Number</label>
                  <input
                    required
                    name="leaderPhone"
                    value={formData.leaderPhone}
                    onChange={handleChange}
                    type="tel"
                    pattern="[0-9]{10}"
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all"
                    placeholder="10 Digit Mobile No."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">Email ID <span className="text-[10px] text-gray-500 normal-case ml-1">(Locked)</span></label>
                  <input
                    required
                    readOnly
                    name="leaderEmail"
                    value={formData.leaderEmail}
                    type="email"
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-gray-400 cursor-not-allowed border-l-2 border-l-cyber-blue"
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">USN</label>
                  <input
                    required
                    name="leaderUSN"
                    value={formData.leaderUSN}
                    onChange={handleChange}
                    type="text"
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all uppercase"
                    placeholder="2JC..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">Semester</label>
                  <select
                    required
                    name="leaderSemester"
                    value={formData.leaderSemester}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900 text-gray-500">Select Semester</option>
                    {SEMESTERS.map(sem => (
                      <option key={sem} value={sem} className="bg-gray-900">{sem}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">Branch</label>
                  <select
                    required
                    name="leaderBranch"
                    value={formData.leaderBranch}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900 text-gray-500">Select Branch</option>
                    {BRANCHES.map(branch => (
                      <option key={branch} value={branch} className="bg-gray-900">{branch}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: MEMBER 2 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-4">
                <User className="w-5 h-5 text-cyber-purple" />
                <h3 className="text-xl font-display text-white tracking-wide">MEMBER 2</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">Full Name</label>
                  <input
                    required
                    name="member2Name"
                    value={formData.member2Name}
                    onChange={handleChange}
                    type="text"
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all"
                    placeholder="Member 2 Name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">Phone Number</label>
                  <input
                    required
                    name="member2Phone"
                    value={formData.member2Phone}
                    onChange={handleChange}
                    type="tel"
                    pattern="[0-9]{10}"
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">Email ID</label>
                  <input
                    required
                    name="member2Email"
                    value={formData.member2Email}
                    onChange={handleChange}
                    type="email"
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">USN</label>
                  <input
                    required
                    name="member2USN"
                    value={formData.member2USN}
                    onChange={handleChange}
                    type="text"
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all uppercase"
                    placeholder="2JC..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">Semester</label>
                  <select
                    required
                    name="member2Semester"
                    value={formData.member2Semester}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900 text-gray-500">Select Semester</option>
                    {SEMESTERS.map(sem => (
                      <option key={sem} value={sem} className="bg-gray-900">{sem}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyber-blue uppercase tracking-widest font-bold ml-1">Branch</label>
                  <select
                    required
                    name="member2Branch"
                    value={formData.member2Branch}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-base focus:outline-none focus:border-cyber-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900 text-gray-500">Select Branch</option>
                    {BRANCHES.map(branch => (
                      <option key={branch} value={branch} className="bg-gray-900">{branch}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Agreement & Submit */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-start space-x-3 bg-black/30 p-4 rounded-lg border border-white/5 mb-6 hover:border-cyber-blue/30 transition-colors">
                <input
                  type="checkbox"
                  id="rules-agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-5 h-5 accent-cyber-blue cursor-pointer mt-0.5"
                />
                <label htmlFor="rules-agree" className="text-sm text-gray-300 cursor-pointer select-none leading-relaxed">
                  I confirm that all provided details are accurate. I have read and agree to the <a href="#rules" className="text-cyber-blue hover:underline font-bold">Rules & Eligibility</a>.
                </label>
              </div>

              <button
                type="submit"
                className={`w-full relative group overflow-hidden border font-display font-bold uppercase tracking-wider py-5 rounded-lg transition-all duration-300 transform
                    bg-gradient-to-r from-cyber-blue/10 to-cyber-purple/10 border-cyber-blue text-cyber-blue hover:text-black hover:border-cyber-blue hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] cursor-pointer
                `}
              >
                <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
                  <span>Next: Payment</span>
                  <ArrowRight className="w-5 h-5" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue to-cyber-purple transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 z-0"></div>
              </button>

              {/* TRUST BOOST BADGES */}
              <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4 text-sm font-sans">
                <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/30 text-green-300 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold tracking-wide">Participation Certificate Provided</span>
                </div>
                <div className="flex items-center gap-2 bg-cyber-blue/10 px-4 py-2 rounded-full border border-cyber-blue/30 text-cyber-blue shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                  <Coffee className="w-4 h-4" />
                  <span className="font-semibold tracking-wide">Refreshments Provided</span>
                </div>
              </div>
            </div>
          </form>
        ) : (
          // ----------------------------------------------------------------
          // STEP 2: PAYMENT & UPLOAD
          // ----------------------------------------------------------------
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-400 hover:text-cyber-blue transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Details
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* QR Code Section */}
              <div className="flex flex-col items-center bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-cyber-pink/50 transition-colors w-full">
                <h3 className="text-xl font-display text-white mb-2 text-center">SCAN & PAY</h3>
                <p className="text-cyber-pink font-mono text-xl font-bold mb-4">₹{REGISTRATION_FEE}.00</p>

                <div className="bg-white p-4 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-4 w-full max-w-[200px] aspect-square flex items-center justify-center">
                  {/* Realistic QR placeholder pointing to UPI */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${UPI_ID}&pn=JCET%20Hackathon&am=${REGISTRATION_FEE}`}
                    alt="Payment QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <p className="text-gray-400 text-sm mb-1">UPI ID:</p>
                <code className="bg-black/50 px-3 py-1 rounded text-cyber-blue font-mono text-sm break-all">{UPI_ID}</code>
              </div>

              {/* Upload Section */}
              <div className="flex flex-col h-full justify-between space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-display text-white">UPLOAD SCREENSHOT</h3>
                  <p className="text-gray-400 text-sm">Upload the payment success screenshot for verification.</p>
                </div>

                <div
                  className={`flex-1 min-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all cursor-pointer relative overflow-hidden ${previewUrl ? 'border-cyber-blue bg-cyber-blue/5' : 'border-gray-600 hover:border-cyber-blue/50 hover:bg-white/5'
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                  />

                  {previewUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img src={previewUrl} alt="Preview" className="max-h-48 rounded shadow-lg object-contain mb-2" />
                      <p className="text-cyber-blue text-sm font-bold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Selected
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setScreenshotFile(null);
                          setPreviewUrl(null);
                        }}
                        className="absolute top-0 right-0 p-1 bg-red-500/80 rounded-full hover:bg-red-600 text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mb-3" />
                      <p className="text-gray-300 font-medium">Click to Upload</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG (Max 10MB)</p>
                    </>
                  )}
                </div>

                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className={`w-full relative group overflow-hidden border font-display font-bold uppercase tracking-wider py-4 rounded-lg transition-all duration-300 transform
                                ${loading
                      ? 'bg-cyber-blue/10 border-cyber-blue text-cyber-blue opacity-80 cursor-wait'
                      : 'bg-gradient-to-r from-green-500/20 to-cyber-blue/20 border-cyber-blue text-white hover:border-green-400 hover:shadow-[0_0_30px_rgba(74,222,128,0.4)] cursor-pointer'
                    }
                            `}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin w-6 h-6" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Confirm Registration</span>
                      </>
                    )}
                  </span>
                  {!loading && <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-cyber-blue transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 z-0"></div>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationForm;
