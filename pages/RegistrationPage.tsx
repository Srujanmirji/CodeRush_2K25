import React, { useEffect } from 'react';
import RegistrationForm from '../components/RegistrationForm';
import ThreeBackground from '../components/ThreeBackground';
import Navbar from '../components/Navbar';
import { Sparkles, ShieldCheck } from 'lucide-react';

const RegistrationPage = () => {

    // Ensure scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="relative text-white min-h-screen bg-black selection:bg-cyber-pink selection:text-white overflow-hidden">
            <ThreeBackground />

            <Navbar />

            <div className="relative z-10 flex flex-col pt-32 pb-20 px-4 min-h-screen">

                {/* Header Section */}
                <div className="w-full max-w-4xl mx-auto text-center mb-12 animate-in fade-in slide-in-from-top-10 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyber-pink/10 border border-cyber-pink/30 rounded-full text-cyber-pink text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_10px_rgba(255,0,255,0.2)]">
                        <Sparkles className="w-3 h-3 animate-pulse" />
                        <span>Limited Slots Available</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
                        SECURE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue via-purple-500 to-cyber-pink animate-gradient">SPOT</span>
                    </h1>

                    <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        Join the elite grid of developers. Register your team for
                        <span className="text-cyber-blue font-bold mx-1">CodeRush 2K25</span>
                        and compete for glory.
                    </p>

                    {/* Quick Stats or Trust Indicators could go here if needed */}
                </div>

                {/* Main Form */}
                <RegistrationForm />

                {/* Footer / Disclaimers */}
                <div className="max-w-4xl mx-auto w-full mt-12 text-center border-t border-white/5 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-500 font-mono">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            <span>Secure Payment Gateway via UPI</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-700 rounded-full hidden md:block"></div>
                        <p>Official Hackathon of JCET Hubballi</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RegistrationPage;
