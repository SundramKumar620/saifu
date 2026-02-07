import React, { useState, useEffect, useRef } from 'react';
import '../styles/HeroSection.css';
import logo from '../assets/logo.png';
import bg from '../assets/bg.png';
import { Menu, X } from 'lucide-react';

export default function HeroSection({ onGetStarted }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);
    const hamburgerRef = useRef(null);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isMobileMenuOpen &&
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target) &&
                hamburgerRef.current &&
                !hamburgerRef.current.contains(event.target)
            ) {
                closeMobileMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobileMenuOpen]);

    return (
        <div className="hero-container" style={{ backgroundImage: `url(${bg})` }}>

            {/* Navigation Bar */}
            <nav className="hero-navbar">
                <div className="hero-navbar-left">
                    <div className="hero-nav-logo">
                        <img src={logo} alt="Saifu Logo" />
                        <span className="hero-nav-logo-text">Saifu</span>
                    </div>
                </div>
                <div className="hero-navbar-right">
                    <a href="#features" className="hero-nav-link" onClick={closeMobileMenu}>Features</a>
                    <a href="#about" className="hero-nav-link" onClick={closeMobileMenu}>About</a>
                    <a href="#security" className="hero-nav-link" onClick={closeMobileMenu}>Security</a>
                </div>
                <button
                    ref={hamburgerRef}
                    className="hero-nav-mobile-toggle"
                    onClick={toggleMobileMenu}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </nav>

            {/* Mobile Menu */}
            <div
                ref={mobileMenuRef}
                className={`hero-nav-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
            >
                <a href="#features" className="hero-nav-mobile-link" onClick={closeMobileMenu}>Features</a>
                <a href="#about" className="hero-nav-mobile-link" onClick={closeMobileMenu}>About</a>
                <a href="#security" className="hero-nav-mobile-link" onClick={closeMobileMenu}>Security</a>
            </div>

            {/* Hero content */}
            <div className="hero-content">
                <div className="hero-main">
                    <h1 className="hero-title">
                        <span className="hero-title-line">Secure Solana Wallet</span>
                        <span className="hero-title-line">For Everyone</span>
                    </h1>
                    <p className="hero-subtitle">
                        The all-in-one Solana HD wallet for secure, decentralized transactions
                    </p>

                    <div className="hero-buttons">
                        <button className="btn-hero-primary" onClick={onGetStarted}>
                            Get Started
                        </button>
                        <button
                            className="btn-hero-secondary"
                            onClick={() => {
                                // Trigger download
                                const link = document.createElement('a');
                                link.href = '/Saifu.zip';
                                link.download = 'Saifu.zip';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);

                                // Open video tutorial
                                window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank'); // TODO: Replace with actual video URL
                            }}
                        >
                            Use as Extension
                        </button>
                    </div>
                </div>


            </div>
            <div className="hero-footer">
                <span>Solana HD Wallet | Secure • Decentralized • Trusted</span>
            </div>
        </div>
    );
}
