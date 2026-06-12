import React, { useState, useEffect, useRef } from 'react';

function LoadingBar() {
    const [loading, setLoading] = useState(false);
    const countRef = useRef(0);

    useEffect(() => {
        const handleStart = () => {
            countRef.current += 1;
            if (countRef.current === 1) {
                setLoading(true);
            }
        };
        const handleEnd = () => {
            countRef.current = Math.max(0, countRef.current - 1);
            if (countRef.current === 0) {
                setLoading(false);
            }
        };

        window.addEventListener('api-loading-start', handleStart);
        window.addEventListener('api-loading-end', handleEnd);

        return () => {
            window.removeEventListener('api-loading-start', handleStart);
            window.removeEventListener('api-loading-end', handleEnd);
        };
    }, []);

    if (!loading) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 'env(safe-area-inset-top, 0px)',
            left: 0,
            right: 0,
            height: '3px',
            zIndex: 99999,
            backgroundColor: 'transparent',
            pointerEvents: 'none',
        }}>
            <div style={{
                height: '100%',
                backgroundColor: '#165DFF',
                animation: 'loadingBarProgress 2s ease-in-out infinite',
                borderRadius: '0 2px 2px 0',
            }} />
        </div>
    );
}

export default LoadingBar;
