import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, departmentAPI } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    real_name: '',
    email: '',
    phone: '',
    department_id: ''
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentAPI.getTree();
        const deptList = res.data || [];
        const flatten = (list) => {
          let result = [];
          list.forEach(d => {
            result.push(d);
            if (d.children) result = result.concat(flatten(d.children));
          });
          return result;
        };
        setDepartments(flatten(deptList));
      } catch (e) {}
    };
    fetchDepts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password || !formData.real_name) {
      setError('用户名、密码和真实姓名不能为空');
      return;
    }
    if (!formData.phone) {
      setError('手机号不能为空');
      return;
    }
    if (formData.password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        username: formData.username,
        password: formData.password,
        real_name: formData.real_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        department_id: formData.department_id || undefined
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-50 rounded-full opacity-40"></div>
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-orange-50 rounded-full opacity-30"></div>
        </div>
        <div className="relative z-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-md animate-fadeIn text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">注册成功</h2>
          <p className="text-gray-500 mb-6">您的账号已提交，请等待管理员审核后即可登录</p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary w-full py-3 text-base"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-50 rounded-full opacity-40"></div>
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-orange-50 rounded-full opacity-30"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-50 rounded-full opacity-20"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="animate-login-title mb-2" style={{ transform: 'rotate(-3deg)' }}>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-gray-800 leading-tight">
              数<span style={{ color: '#60A5FA' }}>智</span>科<span style={{ color: '#FB923C' }}>技</span>产业学院
            </h1>
          </div>
          <div className="animate-login-sub" style={{ transform: 'rotate(-2deg)' }}>
            <p className="text-[10px] sm:text-xs tracking-[0.2em] font-semibold text-gray-800" style={{ opacity: 0.75 }}>
              DIGITAL <span style={{ color: '#60A5FA' }}>I</span>NTELLIGENCE <span style={{ color: '#FB923C' }}>T</span>ECHNOLOGY INDUSTRY COLLEGE
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 animate-fadeIn">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20">
              <img
                src="/long.jpg"
                alt="Logo"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
              <div className="w-full h-full items-center justify-center text-white text-lg font-bold" style={{ display: 'none' }}>
                ZC
              </div>
            </div>
          </div>
          <h2 className="text-center text-lg font-semibold text-gray-700 mb-5">用户注册</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label">工号/学号 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input"
                placeholder="请输入工号或学号"
              />
            </div>

            <div>
              <label className="label">真实姓名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="real_name"
                value={formData.real_name}
                onChange={handleChange}
                className="input"
                placeholder="请输入真实姓名"
              />
            </div>

            <div>
              <label className="label">密码 <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="请输入密码（至少6位）"
              />
            </div>

            <div>
              <label className="label">确认密码 <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="请再次输入密码"
              />
            </div>

            <div>
              <label className="label">邮箱</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="选填"
              />
            </div>
            <div>
              <label className="label">手机号 <span className="text-red-500">*</span></label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                placeholder="请输入手机号"
              />
            </div>

            <div>
              <label className="label">所属部门</label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">请选择部门</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {'  '.repeat((d.level || 1) - 1)}{d.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  注册中...
                </span>
              ) : '注 册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              已有账号？
              <Link to="/login" className="text-primary hover:text-blue-700 font-medium ml-1">
                返回登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
