import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, retryCount: 0 };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary捕获错误:', error, errorInfo);
    }

    handleReset = () => {
        const nextCount = this.state.retryCount + 1;
        if (nextCount >= 3) {
            window.location.reload();
            return;
        }
        this.setState({ hasError: false, error: null, retryCount: nextCount });
    };

    render() {
        if (this.state.hasError) {
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
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1D2129', marginBottom: '8px' }}>页面出现错误</h2>
                        <p style={{ fontSize: '14px', color: '#86909C', marginBottom: '24px' }}>抱歉，页面遇到了一些问题</p>
                        <button
                            onClick={this.handleReset}
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
                            {this.state.retryCount >= 2 ? '刷新页面' : '重试'}
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
