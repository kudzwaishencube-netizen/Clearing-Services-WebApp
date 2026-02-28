import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { Menu, X, Anchor } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/#services' },
    { name: 'Inventory', href: '/#inventory' },
    { name: 'Contact', href: '/#contact' },
  ];

  const headerBg = isAdmin || isScrolled ? 'bg-white shadow-sm py-3' : 'bg-transparent py-6';
  const textColor = isAdmin || isScrolled ? 'text-gray-900' : 'text-white';
  const logoBg = isAdmin || isScrolled ? 'bg-primary text-white' : 'bg-white text-primary';

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className={`p-2 rounded-lg transition-colors ${logoBg}`}>
              <Anchor className="w-6 h-6" />
            </div>
            <span className={`text-xl font-bold tracking-tight transition-colors ${textColor}`}>
              ANCHOR<span className="text-primary">FREIGHT</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm font-medium hover:text-primary transition-colors ${
                  isAdmin || isScrolled ? 'text-gray-700' : 'text-white/90 hover:text-white'
                }`}
              >
                {link.name}
              </a>
            ))}
            <Link
              to="/admin"
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                isAdmin || isScrolled 
                  ? 'bg-primary text-white hover:bg-orange-600' 
                  : 'bg-white text-primary hover:bg-gray-100'
              }`}
            >
              {isAdmin ? 'Public Site' : 'Staff Login'}
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled ? 'text-gray-900' : 'text-white'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isScrolled ? 'text-gray-900' : 'text-white'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 p-4 md:hidden"
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-700 font-medium hover:text-primary py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <Link
              to="/admin"
              className="bg-primary text-white text-center py-3 rounded-lg font-bold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {isAdmin ? 'Public Site' : 'Staff Login'}
            </Link>
          </div>
        </motion.div>
      )}
    </header>
  );
}
