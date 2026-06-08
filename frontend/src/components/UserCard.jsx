import { useState, useEffect, useRef } from 'react';
import { userAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const UserCard = ({ userId, children }) => {
  const [showCard, setShowCard] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef(null);
  const triggerRef = useRef(null);
  const { user: currentUser } = useAuthStore();

  // 获取角色显示名称
  const getRoleName = (role) => {
    const roleMap = {
      'super_admin': '超级管理员',
      'dept_admin': '部门管理员',
      'normal_user': '普通用户'
    };
    return roleMap[role] || role;
  };

  // 判断是否可以查看敏感信息
  const canViewSensitiveInfo = () => {
    if (!currentUser || !userInfo) return false;
    // 超级管理员可以查看所有信息
    if (currentUser.role === 'super_admin') return true;
    // 部门管理员可以查看本部门用户的所有信息
    if (currentUser.role === 'dept_admin' && currentUser.department_id === userInfo.department_id) return true;
    // 查看自己的信息
    if (currentUser.id === userInfo.id) return true;
    return false;
  };

  // 脱敏手机号
  const maskPhone = (phone) => {
    if (!phone) return '-';
    if (canViewSensitiveInfo()) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  // 脱敏邮箱
  const maskEmail = (email) => {
    if (!email) return '-';
    if (canViewSensitiveInfo()) return email;
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const maskedName = name.length > 2 ? name[0] + '***' + name[name.length - 1] : name[0] + '***';
    return `${maskedName}@${domain}`;
  };

  // 获取用户信息
  const fetchUserInfo = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await userAPI.getById(userId);
      setUserInfo(response.data);
    } catch (error) {
      console.error('获取用户信息失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算卡片位置
  const calculatePosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = 280;
    const cardHeight = 280;

    let top = rect.bottom + 8;
    let left = rect.left;

    // 检查是否超出右边界
    if (left + cardWidth > viewportWidth - 16) {
      left = viewportWidth - cardWidth - 16;
    }

    // 检查是否超出左边界
    if (left < 16) {
      left = 16;
    }

    // 检查是否超出下边界
    if (top + cardHeight > viewportHeight - 16) {
      top = rect.top - cardHeight - 8;
    }

    // 移动端居中显示
    if (viewportWidth < 640) {
      left = (viewportWidth - cardWidth) / 2;
      top = (viewportHeight - cardHeight) / 2;
    }

    return { top, left };
  };

  // 点击触发
  const handleClick = (e) => {
    e.stopPropagation();
    if (!showCard) {
      fetchUserInfo();
    }
    setShowCard(!showCard);
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setShowCard(false);
      }
    };

    if (showCard) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      setPosition(calculatePosition());
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showCard]);

  // 滚动时关闭卡片
  useEffect(() => {
    const handleScroll = () => {
      if (showCard) {
        setShowCard(false);
      }
    };

    if (showCard) {
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showCard]);

  if (!userId) {
    return <span className="text-gray-500">-</span>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        onClick={handleClick}
        className="text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
      >
        {children}
      </span>

      {showCard && (
        <div
          ref={cardRef}
          className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-[280px] sm:w-[280px]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setShowCard(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
          ) : userInfo ? (
            <div className="space-y-3">
              {/* 头部 */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                  {userInfo.real_name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{userInfo.real_name || '-'}</h3>
                  <p className="text-sm text-gray-500">@{userInfo.username || '-'}</p>
                </div>
              </div>

              {/* 信息列表 */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <span className="w-20 text-gray-500 flex-shrink-0">所属院系</span>
                  <span className="text-gray-900">{userInfo.department?.name || '-'}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-20 text-gray-500 flex-shrink-0">角色</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    userInfo.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                    userInfo.role === 'dept_admin' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getRoleName(userInfo.role)}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-20 text-gray-500 flex-shrink-0">手机号</span>
                  <span className="text-gray-900">{maskPhone(userInfo.phone)}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-20 text-gray-500 flex-shrink-0">邮箱</span>
                  <span className="text-gray-900 break-all">{maskEmail(userInfo.email)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">获取用户信息失败</div>
          )}
        </div>
      )}
    </>
  );
};

export default UserCard;
