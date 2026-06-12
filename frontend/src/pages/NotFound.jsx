import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/dashboard', { replace: true });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            backgroundColor: '#F7F8FA',
            fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif'
        }}>
            <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                maxWidth: '400px',
                width: '100%'
            }}>
                <div style={{ fontSize: '72px', fontWeight: 700, color: '#165DFF', marginBottom: '8px', lineHeight: 1 }}>404</div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1D2129', marginBottom: '8px' }}>页面不存在</h2>
                <p style={{ fontSize: '14px', color: '#86909C', marginBottom: '24px' }}>您访问的页面不存在或已被移除</p>
                <button
                    onClick={handleGoHome}
                    style={{
                        padding: '8px 24px',
                        backgroundColor: '#165DFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    返回首页
                </button>
            </div>
        </div>
    );
}

export default NotFound;
