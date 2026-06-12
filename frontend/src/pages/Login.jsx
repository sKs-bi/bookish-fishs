import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import LoginParticles from '../components/LoginParticles';

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
  const [searchParams, setSearchParams] = useSearchParams();

  // 检测登录过期参数
  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setError('登录已过期，请重新登录');
      setSearchParams({}, { replace: true });
    }
  }, []);

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
          {/* 电路板线路 */}
          <svg className="login-geo-diamond login-geo-anim-1" width="280" height="180" viewBox="0 0 280 180">
            <path d="M10,90 L50,90 L50,40 L100,40 L100,90 L140,90 L140,140 L190,140 L190,90 L230,90 L230,50 L270,50" fill="none" stroke="rgba(59,130,246,0.35)" strokeWidth="2"/>
            <path d="M50,90 L50,140 L80,140" fill="none" stroke="rgba(6,182,212,0.3)" strokeWidth="1.5"/>
            <path d="M140,90 L140,40 L170,40" fill="none" stroke="rgba(6,182,212,0.3)" strokeWidth="1.5"/>
            <circle cx="50" cy="90" r="5" fill="rgba(96,165,250,0.5)"/>
            <circle cx="100" cy="40" r="5" fill="rgba(6,182,212,0.5)"/>
            <circle cx="140" cy="90" r="5" fill="rgba(96,165,250,0.5)"/>
            <circle cx="190" cy="140" r="5" fill="rgba(6,182,212,0.5)"/>
            <circle cx="230" cy="90" r="5" fill="rgba(96,165,250,0.5)"/>
            <circle cx="270" cy="50" r="5" fill="rgba(6,182,212,0.5)"/>
          </svg>
          {/* 数据芯片 */}
          <svg className="login-geo-diamond login-geo-anim-2" width="140" height="140" viewBox="0 0 140 140">
            <rect x="25" y="25" width="90" height="90" rx="8" fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="2"/>
            <rect x="40" y="40" width="60" height="60" rx="4" fill="none" stroke="rgba(6,182,212,0.25)" strokeWidth="1.5"/>
            <line x1="25" y1="48" x2="5" y2="48" stroke="rgba(59,130,246,0.25)" strokeWidth="1.5"/>
            <line x1="25" y1="70" x2="5" y2="70" stroke="rgba(59,130,246,0.25)" strokeWidth="1.5"/>
            <line x1="25" y1="92" x2="5" y2="92" stroke="rgba(59,130,246,0.25)" strokeWidth="1.5"/>
            <line x1="115" y1="48" x2="135" y2="48" stroke="rgba(59,130,246,0.25)" strokeWidth="1.5"/>
            <line x1="115" y1="70" x2="135" y2="70" stroke="rgba(59,130,246,0.25)" strokeWidth="1.5"/>
            <line x1="115" y1="92" x2="135" y2="92" stroke="rgba(59,130,246,0.25)" strokeWidth="1.5"/>
            <line x1="48" y1="25" x2="48" y2="5" stroke="rgba(6,182,212,0.25)" strokeWidth="1.5"/>
            <line x1="70" y1="25" x2="70" y2="5" stroke="rgba(6,182,212,0.25)" strokeWidth="1.5"/>
            <line x1="92" y1="25" x2="92" y2="5" stroke="rgba(6,182,212,0.25)" strokeWidth="1.5"/>
            <line x1="48" y1="115" x2="48" y2="135" stroke="rgba(6,182,212,0.25)" strokeWidth="1.5"/>
            <line x1="70" y1="115" x2="70" y2="135" stroke="rgba(6,182,212,0.25)" strokeWidth="1.5"/>
            <line x1="92" y1="115" x2="92" y2="135" stroke="rgba(6,182,212,0.25)" strokeWidth="1.5"/>
            <circle cx="70" cy="70" r="4" fill="rgba(96,165,250,0.4)"/>
          </svg>
          {/* 二进制代码流 - 改为CSS动画驱动，多个流动元素 */}
          <div className="login-binary-flow">
            <span className="binary-str binary-str-1">01101001</span>
            <span className="binary-str binary-str-2">10010110</span>
            <span className="binary-str binary-str-3">11001010</span>
            <span className="binary-str binary-str-4">00110101</span>
            <span className="binary-str binary-str-5">10110010</span>
            <span className="binary-str binary-str-6">01011001</span>
            <span className="binary-str binary-str-7">11010011</span>
            <span className="binary-str binary-str-8">00101101</span>
          </div>
          {/* 数据图表 */}
          <svg className="login-geo-hex login-geo-anim-4" width="180" height="120" viewBox="0 0 180 120">
            <polyline points="10,95 35,65 65,78 100,30 140,50 170,18" fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="2.2"/>
            <line x1="10" y1="108" x2="170" y2="108" stroke="rgba(6,182,212,0.18)" strokeWidth="1.2"/>
            <line x1="10" y1="18" x2="10" y2="108" stroke="rgba(6,182,212,0.18)" strokeWidth="1.2"/>
            <circle cx="35" cy="65" r="4.5" fill="rgba(96,165,250,0.5)"/>
            <circle cx="100" cy="30" r="4.5" fill="rgba(6,182,212,0.5)"/>
            <circle cx="170" cy="18" r="4.5" fill="rgba(96,165,250,0.5)"/>
            <path d="M10,95 L35,65 L65,78 L100,30 L140,50 L170,18 L170,108 L10,108 Z" fill="rgba(59,130,246,0.06)"/>
          </svg>
          {/* 六边形网格 */}
          <svg className="login-geo-circle login-geo-anim-5" width="240" height="180" viewBox="0 0 240 180">
            <polygon points="35,10 55,10 65,27 55,44 35,44 25,27" fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5"/>
            <polygon points="55,10 75,10 85,27 75,44 55,44 65,27" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1.5"/>
            <polygon points="75,10 95,10 105,27 95,44 75,44 85,27" fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5"/>
            <polygon points="95,10 115,10 125,27 115,44 95,44 105,27" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1.5"/>
            <polygon points="115,10 135,10 145,27 135,44 115,44 125,27" fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5"/>
            <polygon points="25,44 45,44 55,61 45,78 25,78 15,61" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1.5"/>
            <polygon points="45,44 65,44 75,61 65,78 45,78 55,61" fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5"/>
            <polygon points="65,44 85,44 95,61 85,78 65,78 75,61" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1.5"/>
            <polygon points="85,44 105,44 115,61 105,78 85,78 95,61" fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5"/>
            <polygon points="105,44 125,44 135,61 125,78 105,78 115,61" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1.5"/>
            <polygon points="35,78 55,78 65,95 55,112 35,112 25,95" fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5"/>
            <polygon points="55,78 75,78 85,95 75,112 55,112 65,95" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1.5"/>
            <polygon points="75,78 95,78 105,95 95,112 75,112 85,95" fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5"/>
            <polygon points="95,78 115,78 125,95 115,112 95,112 105,95" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1.5"/>
            <polygon points="115,78 135,78 145,95 135,112 115,112 125,95" fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5"/>
            <polygon points="135,78 155,78 165,95 155,112 135,112 145,95" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1.5"/>
            <polygon points="155,78 175,78 185,95 175,112 155,112 165,95" fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5"/>
          </svg>
        </div>
        <LoginParticles />
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
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
