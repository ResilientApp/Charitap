import React, { useState, useRef } from 'react';

const RippleButton = ({ 
  children, 
  className = '', 
  onClick, 
  disabled = false,
  type = 'button',
  ...props 
}) => {
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);
  const nextId = useRef(0);
  const timeouts = useRef(new Set());

  React.useEffect(() => {
    const currentTimeouts = timeouts.current;
    return () => {
      currentTimeouts.forEach(clearTimeout);
      currentTimeouts.clear();
    };
  }, []);

  const createRipple = (event) => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    nextId.current += 1;
    const rippleId = nextId.current;

    const ripple = {
      id: rippleId,
      x,
      y,
      size
    };

    setRipples(prev => [...prev, ripple]);

    // Remove ripple after animation
    const timeoutId = setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
      timeouts.current.delete(timeoutId);
    }, 600);
    timeouts.current.add(timeoutId);
  };

  const handleClick = (event) => {
    if (!disabled) {
      createRipple(event);
      onClick && onClick(event);
    }
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      className={`relative overflow-hidden transition-all duration-200 ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white bg-opacity-30 rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size
          }}
        />
      ))}
    </button>
  );
};

export default RippleButton; 