
import React, { useState, useEffect } from 'react';
import { Menu, X, Terminal } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Rules', href: '#rules' },
    { name: 'Register', href: '#register' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false); // Close mobile menu if open

    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);

    if (element) {
      const navbarHeight = 80; // Approximate height of the fixed navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <nav
      className={`fixed w-full z-50 top-0 left-0 transition-all duration-300 ${scrolled || isOpen ? 'bg-cyber-black/90 backdrop-blur-lg border-b border-cyber-glass' : 'bg-transparent border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setIsOpen(false); }} className="flex items-center space-x-2 flex-shrink-0 cursor-pointer">
            <Terminal className="text-cyber-blue w-6 h-6 md:w-8 md:h-8" />
            <span className="font-display font-bold text-lg md:text-2xl tracking-wider text-white whitespace-nowrap">
              FRONTEND<span className="text-cyber-pink"> DOMINATION</span>
            </span>
          </a>

          {/* Desktop Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="font-display text-gray-300 hover:text-cyber-blue hover:shadow-[0_0_10px_#00f0ff] transition-all duration-300 px-3 py-2 rounded-md text-sm font-medium uppercase tracking-widest cursor-pointer"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-cyber-glass focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-cyber-black/95 backdrop-blur-xl transition-transform duration-300 ease-in-out pt-24 ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="px-4 pt-2 pb-3 space-y-4 flex flex-col items-center">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-gray-300 hover:text-cyber-blue hover:scale-105 transform transition-all block px-3 py-2 rounded-md text-2xl font-medium font-display uppercase tracking-wider w-full text-center border-b border-white/5 cursor-pointer"
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
