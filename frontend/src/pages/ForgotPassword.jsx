import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.username) {
      setError('请输入用户名');
      return;
    }
    if (!formData.newPassword) {
      setError('请输入新密码');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword({
        username: formData.username,
        newPassword: formData.newPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || '密码重置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-layer">
        <div className="login-aurora"></div>
        <div className="login-orb login-orb-1"></div>
        <div className="login-orb login-orb-2"></div>
        <div className="login-orb login-orb-3"></div>
        <div className="login-grid-overlay"></div>
        <div className="login-noise"></div>
      </div>
      <div className="login-content">
        <div className="login-header">
          <h1 className="login-title">数<span className="login-char-zhi">智</span>科<span className="login-char-ji">技</span>产业学院</h1>
        </div>
        <div className="login-header-sub">
          <p className="login-subtitle">DIGITAL INTELLIGENCE TECHNOLOGY INDUSTRY COLLEGE</p>
        </div>
        <div className="login-card login-card-enter">
          <div className="login-card-glow"></div>
          <div className="login-card-border"></div>
          <div className="login-card-inner">
            <div className="login-logo-wrap">
              <div className="login-logo-ring"></div>
              <div className="login-logo">
                <img src="/long.jpg" alt="Logo" className="login-logo-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                <div className="login-logo-fallback" style={{ display: 'none' }}>ZC</div>
              </div>
            </div>
            <h2 className="login-card-title">找回密码</h2>
            {!success ? (
              <>
                <p className="login-card-desc">请输入用户名和新密码</p>
                <form onSubmit={handleResetPassword} className="login-form">
                  {error && <div className="login-error"><svg className="login-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}
                  <div className="login-field">
                    <div className="login-field-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                    <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="login-field-input" placeholder="请输入用户名" />
                    <div className="login-field-line"></div>
                  </div>
                  <div className="login-field">
                    <div className="login-field-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleInputChange} className="login-field-input" placeholder="请输入新密码（至少6位）" />
                    <div className="login-field-line"></div>
                  </div>
                  <div className="login-field">
                    <div className="login-field-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="login-field-input" placeholder="请再次输入新密码" />
                    <div className="login-field-line"></div>
                  </div>
                  <button type="submit" disabled={loading} className="login-submit"><span className="login-submit-text">{loading ? '重置中...' : '重置密码'}</span></button>
                </form>
              </>
            ) : (
              <div className="forgot-success">
                <svg className="forgot-success-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3>密码重置成功！</h3>
                <p>请使用新密码登录</p>
                <button onClick={() => navigate('/login')} className="login-submit" style={{ marginTop: '1rem' }}><span className="login-submit-text">返回登录</span></button>
              </div>
            )}
            {!success && <div className="login-footer"><Link to="/login" className="login-footer-link">返回登录</Link></div>}
          </div>
        </div>
        <p className="login-copyright">© 2026 数智科技产业学院 · 资产管理平台</p>
      </div>
    </div>
  );
};

export default ForgotPassword;
