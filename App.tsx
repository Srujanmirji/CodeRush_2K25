
import React, { Suspense, useState, useEffect, useRef } from 'react';
import ThreeBackground from './components/ThreeBackground';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ThemeAndRules from './components/ProblemStatements';
import JudgingCriteria from './components/JudgingCriteria';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';
import Timeline from './components/Timeline';
import { Calendar, MapPin, Users, Banknote, Mail, Phone } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple hash-based routing check
    const checkHash = () => {
      setIsAdmin(window.location.hash === '#admin');
    };

    // Check initially
    checkHash();

    // Listen for hash changes
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      const ctx = gsap.context(() => {
        // Footer Animations
        if (footerRef.current) {
          gsap.from(".footer-column", {
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 90%",
            },
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out"
          });

          gsap.from(".footer-bottom", {
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 95%",
            },
            opacity: 0,
            duration: 1,
            delay: 0.5,
            ease: "power2.out"
          });
        }

        // Stats Animations
        if (statsRef.current) {
          gsap.fromTo(".stat-card",
            { autoAlpha: 0, y: 50 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.15,
              ease: "back.out(1.7)",
              scrollTrigger: {
                trigger: statsRef.current,
                start: "top 80%"
              }
            }
          );
        }

      });

      return () => ctx.revert();
    }
  }, [isAdmin]);

  // ------------------------------------------------------------------
  // RENDER ADMIN PANEL
  // ------------------------------------------------------------------
  if (isAdmin) {
    return <AdminPanel />;
  }

  // ------------------------------------------------------------------
  // RENDER MAIN APP
  // ------------------------------------------------------------------
  return (
    <div className="relative min-h-screen text-gray-100 bg-cyber-black selection:bg-cyber-pink selection:text-white">
      {/* 3D Background */}
      <Suspense fallback={null}>
        <ThreeBackground />
      </Suspense>

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10">
        <Hero />

        {/* About / Stats */}
        <section id="about" ref={statsRef} className="py-12 md:py-24 bg-cyber-black/50 backdrop-blur-sm relative z-20">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-center">
            {/* Date */}
            <div className="stat-card p-6 border border-white/10 bg-white/5 rounded-xl hover:border-cyber-blue/50 transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] group">
              <Calendar className="w-12 h-12 text-cyber-blue mx-auto mb-4 group-hover:animate-pulse" />
              <h3 className="text-2xl font-display font-bold text-white mb-2">19th December</h3>
              <p className="text-gray-400">2025</p>
            </div>

            {/* Venue */}
            <div className="stat-card p-6 border border-white/10 bg-white/5 rounded-xl hover:border-cyber-pink/50 transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(255,0,255,0.3)] group">
              <MapPin className="w-12 h-12 text-[#ff00ff] mx-auto mb-4 group-hover:animate-bounce" />
              <h3 className="text-xl font-display font-bold text-white mb-2 leading-tight">Jain College of Engineering & Technology, Hubballi</h3>
              <p className="text-gray-400 text-sm">Venue</p>
            </div>

            {/* Team Size */}
            <div className="stat-card p-6 border border-white/10 bg-white/5 rounded-xl hover:border-cyber-purple/50 transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(112,0,255,0.3)] group">
              <Users className="w-12 h-12 text-cyber-purple mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-display font-bold text-white mb-2">2 Members</h3>
              <p className="text-gray-400">Team Size</p>
            </div>

            {/* Fee */}
            <div className="stat-card p-6 border border-white/10 bg-white/5 rounded-xl hover:border-green-400/50 transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] group">
              <Banknote className="w-12 h-12 text-green-400 mx-auto mb-4 group-hover:rotate-12 transition-transform" />
              <h3 className="text-2xl font-display font-bold text-white mb-2">₹100</h3>
              <p className="text-gray-400">Per Team</p>
            </div>
          </div>
        </section>

        <ThemeAndRules />

        <JudgingCriteria />

        <Timeline />

        {/* Registration Section */}
        <section id="register" className="pt-10 pb-12 md:pb-24 relative z-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-blue/5 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                JOIN THE <span className="text-cyber-pink">GRID</span>
              </h2>
              <p className="text-gray-400">Register your team now. Limited slots available.</p>
            </div>
            <RegistrationForm />
          </div>
        </section>

        {/* Contact / Footer */}
        <footer id="contact" ref={footerRef} className="py-12 bg-black/80 backdrop-blur-md relative z-20">
          <div className="max-w-7xl mx-auto px-4">
            {/* Upper Footer: Info & Socials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 md:mb-10 pb-8 md:pb-10 border-b border-white/10">

              {/* Column 1: College Info */}
              <div className="footer-column text-center md:text-left">
                <h3 className="text-2xl font-display font-bold text-white mb-2">JCET HUBBALLI</h3>
                <p className="text-gray-500 font-sans">Department of Computer Science & Engineering</p>

                <div className="flex gap-6 mt-6 justify-center md:justify-start">
                  <a href="https://www.instagram.com/jcet_hubballi/?igsh=ejQzZ2lxNnMwbHYy#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyber-pink transition-colors">Instagram</a>
                  <a href="#" className="text-gray-400 hover:text-cyber-blue transition-colors">LinkedIn</a>
                  <a href="#" className="text-gray-400 hover:text-cyber-purple transition-colors">Twitter</a>
                </div>
              </div>

              {/* Column 2: Spacer / Decorative (Optional centrally aligned logo or message could go here) */}
              <div className="footer-column hidden md:flex items-center justify-center">
                {/* Placeholder for future use or kept empty for spacing */}
                <div className="w-px h-24 bg-gradient-to-b from-transparent via-gray-700 to-transparent"></div>
              </div>

              {/* Column 3: Contact Info */}
              <div className="footer-column flex flex-col items-center md:items-end gap-4 text-sm font-mono">
                <h4 className="text-white font-bold tracking-widest uppercase mb-2">Contact Us</h4>

                <a href="mailto:hackthefuture@jcet.edu.in" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                  <span>hackthefuture@jcet.edu.in</span>
                  <Mail className="w-4 h-4 text-cyber-blue group-hover:scale-110 transition-transform" />
                </a>

                <div className="flex flex-col gap-2 items-center md:items-end">
                  <a href="tel:9663341218" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                    <span>Srujan: 9663341218</span>
                    <Phone className="w-4 h-4 text-green-400 group-hover:rotate-12 transition-transform" />
                  </a>
                  <a href="tel:9448237314" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                    <span>Sai Sudheer: 9448237314</span>
                    <Phone className="w-4 h-4 text-green-400 group-hover:rotate-12 transition-transform" />
                  </a>
                </div>
              </div>

            </div>

            {/* Middle Footer: Trust Indicators */}
            <div className="footer-column flex flex-col items-center space-y-3 text-sm text-gray-400 font-mono py-8 w-full">
              <div className="flex items-center gap-3">
                <span className="text-lg">🎓</span>
                <span className="tracking-wide">Certificates will be issued to all participants.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">🥤</span>
                <span className="tracking-wide">Refreshments will be provided during the 6-hour hackathon.</span>
              </div>
            </div>

            {/* Lower Footer: Copyright */}
            <div className="footer-bottom text-center mt-8 text-gray-600 text-sm">
              © 2025 FrontEnd Domination. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
