import React, { useEffect, useState, useRef } from 'react';
import '../styles/Modal.css';

// Get scrollbar width to prevent layout shift
function getScrollbarWidth() {
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  outer.style.msOverflowStyle = 'scrollbar';
  document.body.appendChild(outer);

  const inner = document.createElement('div');
  outer.appendChild(inner);

  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  outer.parentNode?.removeChild(outer);

  return scrollbarWidth;
}

// Check if page has a visible scrollbar
function hasScrollbar() {
  const body = document.body;
  const html = document.documentElement;
  
  // Check if content is taller than viewport
  const hasVerticalScroll = body.scrollHeight > window.innerHeight || 
                           html.scrollHeight > window.innerHeight;
  
  return hasVerticalScroll;
}

export default function Modal({ isOpen, onClose, children, className = '' }) {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const scrollbarWidthRef = useRef(0);
  const hadScrollbarRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      // IMMEDIATELY lock scroll before any other operations to prevent race conditions
      const body = document.body;
      body.style.overflow = 'hidden';
      
      setShouldRender(true);
      setIsClosing(false);
      
      // Check if page has scrollbar before hiding it
      hadScrollbarRef.current = hasScrollbar();
      
      // Only calculate and add padding if scrollbar exists
      if (hadScrollbarRef.current) {
        scrollbarWidthRef.current = getScrollbarWidth();
        body.style.paddingRight = `${scrollbarWidthRef.current}px`;
      }
      
      // Trigger animation after render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Force reflow to ensure animation plays
        });
      });
    } else if (shouldRender) {
      setIsClosing(true);
      
      // Keep padding during closing animation to prevent shift
      // Check if another modal is open before unlocking scroll
      const timer = setTimeout(() => {
        // Check if any other modal overlay exists (not closing)
        const otherModals = document.querySelectorAll('.modal-overlay');
        const hasOtherOpenModal = Array.from(otherModals).some(
          modal => !modal.classList.contains('closing')
        );
        
        // Only unlock scroll if no other modal is open
        if (!hasOtherOpenModal) {
          const body = document.body;
          body.style.overflow = '';
          
          // Only remove padding if we added it (had scrollbar)
          if (hadScrollbarRef.current) {
            body.style.paddingRight = '';
          }
        }
        
        setShouldRender(false);
        setIsClosing(false);
      }, 350); // Match animation duration (0.35s)
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      const body = document.body;
      body.style.overflow = 'unset';
      // Only remove padding if we had a scrollbar
      if (hadScrollbarRef.current) {
        body.style.paddingRight = '';
      }
    };
  }, []);

  if (!shouldRender) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`modal-overlay ${isClosing ? 'closing' : ''}`} 
      onClick={handleOverlayClick}
    >
      <div 
        className={`modal-content glassmorphism ${isClosing ? 'closing' : ''} ${className}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

