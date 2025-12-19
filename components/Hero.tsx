import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Hero = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(titleRef.current,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power4.out",
        delay: 0.5
      }
    )
      .fromTo(subtitleRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out"
        }, "-=0.5")
      .fromTo(btnRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.7)"
        }, "-=0.5");

    // Glitch effect loop
    const glitchInterval = setInterval(() => {
      if (titleRef.current) {
        gsap.to(titleRef.current, {
          skewX: 10,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            gsap.set(titleRef.current, { skewX: 0 });
          }
        });
      }
    }, 3000);

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <section className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center z-10 px-4 overflow-hidden">
      <div className="text-center relative max-w-full">
        <div className="absolute -inset-10 bg-cyber-blue/20 blur-[100px] rounded-full pointer-events-none" />

        {/* Responsive Text Sizes: text-4xl for mobile, scaling up for larger screens */}
        <h1
          ref={titleRef}
          className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-black text-white mb-6 relative z-50 break-words leading-tight"
          style={{ textShadow: '0 0 30px rgba(0, 240, 255, 0.6)' }}
        >
          CODERUSH<span className="text-cyber-pink mx-2 inline-block" style={{ textShadow: '0 0 30px rgba(255, 0, 255, 0.6)' }}> 2K25</span>
        </h1>

        <div ref={subtitleRef} className="flex flex-col items-center mb-12">
          <p className="text-cyber-pink text-lg xs:text-xl sm:text-2xl md:text-3xl font-display tracking-wider mb-4 uppercase drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]">
            Not just a hackathon - a full-stack battle with vibes.
          </p>
          <p
            className="text-sm xs:text-base sm:text-xl md:text-2xl font-sans text-cyber-blue/80 tracking-[0.1em] md:tracking-[0.2em] uppercase"
          >
            Dec 29, 2025 • JCET Hubballi
          </p>
        </div>

        <a
          ref={btnRef}
          href="#register"
          className="inline-block relative px-6 py-3 xs:px-8 xs:py-4 sm:px-12 bg-transparent border-2 border-cyber-pink text-white font-display font-bold text-sm sm:text-lg uppercase tracking-widest overflow-hidden group hover:shadow-[0_0_30px_#ff00ff] transition-all duration-300"
        >
          <span className="relative z-10 group-hover:text-black transition-colors duration-300">Start System</span>
          <div className="absolute inset-0 bg-cyber-pink transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
        </a>
      </div>

      <div className="absolute bottom-10 left-0 w-full flex justify-center animate-bounce pointer-events-none">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
          <div className="w-1 h-3 bg-cyber-blue rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;