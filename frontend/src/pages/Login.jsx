import { useState } from 'react';
import useAuthStore from '../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotUsername) {
      setForgotError('请输入用户名');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotError('新密码长度不能少于6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('两次输入的密码不一致');
      return;
    }

    setForgotLoading(true);
    try {
      await authAPI.forgotPassword({ username: forgotUsername, newPassword });
      setForgotSuccess('密码重置成功，请使用新密码登录');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotUsername('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotSuccess('');
      }, 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || '密码重置失败');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotUsername('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
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
        <div className="login-rays">
          <div className="login-ray login-ray-1"></div>
          <div className="login-ray login-ray-2"></div>
          <div className="login-ray login-ray-3"></div>
        </div>
        <div className="login-geo">
          <svg className="login-geo-diamond login-geo-anim-1" width="60" height="60" viewBox="0 0 60 60">
            <polygon points="30,5 55,30 30,55 5,30" fill="none" stroke="rgba(96,165,250,0.08)" strokeWidth="1"/>
          </svg>
          <svg className="login-geo-diamond login-geo-anim-2" width="40" height="40" viewBox="0 0 40 40">
            <polygon points="20,3 37,20 20,37 3,20" fill="none" stroke="rgba(251,146,60,0.06)" strokeWidth="1"/>
          </svg>
          <svg className="login-geo-diamond login-geo-anim-3" width="80" height="80" viewBox="0 0 80 80">
            <polygon points="40,5 75,40 40,75 5,40" fill="none" stroke="rgba(96,165,250,0.05)" strokeWidth="1"/>
            <polygon points="40,18 62,40 40,62 18,40" fill="none" stroke="rgba(96,165,250,0.04)" strokeWidth="1"/>
          </svg>
          <svg className="login-geo-hex login-geo-anim-4" width="50" height="50" viewBox="0 0 50 50">
            <polygon points="25,2 47,14 47,36 25,48 3,36 3,14" fill="none" stroke="rgba(251,146,60,0.06)" strokeWidth="1"/>
          </svg>
          <svg className="login-geo-circle login-geo-anim-5" width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(96,165,250,0.04)" strokeWidth="0.5"/>
            <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(96,165,250,0.03)" strokeWidth="0.5"/>
            <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(96,165,250,0.02)" strokeWidth="0.5"/>
          </svg>
        </div>
        <div className="login-particles">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="login-particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              width: `${1.5 + Math.random() * 3}px`,
              height: `${1.5 + Math.random() * 3}px`,
              background: i % 3 === 0 ? 'rgba(251,146,60,0.5)' : 'rgba(96,165,250,0.4)',
            }}></div>
          ))}
        </div>
      </div>

      <div className="login-content">
        <div className="login-header animate-login-title">
          <h1 className="login-title">
            数<span className="login-char-zhi">智</span>科<span className="login-char-ji">技</span>产业学院
          </h1>
        </div>
        <div className="login-header-sub animate-login-sub">
          <p className="login-subtitle">
            DIGITAL <span className="login-char-zhi">I</span>NTELLIGENCE <span className="login-char-ji">T</span>ECHNOLOGY INDUSTRY COLLEGE
          </p>
        </div>

        <div className="login-card login-card-enter">
          <div className="login-card-glow"></div>
          <div className="login-card-border"></div>

          <div className="login-card-inner">
            <div className="login-logo-wrap">
              <div className="login-logo-ring"></div>
              <div className="login-logo">
                <img
                  src="/long.jpg"
                  alt="Logo"
                  className="login-logo-img"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="login-logo-fallback" style={{ display: 'none' }}>ZC</div>
              </div>
            </div>

            <h2 className="login-card-title">资产管理系统</h2>
            <p className="login-card-desc">符合教育部高校财务审计标准</p>

            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="login-error">
                  <svg className="login-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="login-field">
                <div className="login-field-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-field-input"
                  placeholder="请输入工号或学号"
                  autoComplete="username"
                />
                <div className="login-field-line"></div>
              </div>

              <div className="login-field">
                <div className="login-field-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-field-input"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
                <div className="login-field-line"></div>
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                <span className="login-submit-text">
                  {loading ? (
                    <>
                      <svg className="login-spinner" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c03.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      登录中...
                    </>
                  ) : '登 录'}
                </span>
              </button>

              <div className="login-forgot-link">
                <button type="button" onClick={() => setShowForgotModal(true)}>
                  忘记密码？
                </button>
              </div>
            </form>

            <div className="login-footer">
              <span>还没有账号？</span>
              <Link to="/register" className="login-footer-link">立即注册</Link>
            </div>
          </div>
        </div>

        {/* 忘记密码弹窗 */}
        {showForgotModal && (
          <div className="modal-overlay" onClick={closeForgotModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>重置密码</h3>
                <button className="modal-close" onClick={closeForgotModal}>&times;</button>
              </div>
              <form onSubmit={handleForgotPassword} className="modal-body">
                {forgotError && (
                  <div className="modal-error">{forgotError}</div>
                )}
                {forgotSuccess && (
                  <div className="modal-success">{forgotSuccess}</div>
                )}
                <div className="modal-field">
                  <label>用户名</label>
                  <input
                    type="text"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    placeholder="请输入用户名"
                  />
                </div>
                <div className="modal-field">
                  <label>新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码（至少6位）"
                  />
                </div>
                <div className="modal-field">
                  <label>确认密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeForgotModal}>
                    取消
                  </button>
                  <button type="submit" className="btn-submit" disabled={forgotLoading}>
                    {forgotLoading ? '处理中...' : '确认重置'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <p className="login-copyright">© 2024 数智科技产业学院 · 资产管理平台</p>
      </div>
    </div>
  );
};

export default Login;
