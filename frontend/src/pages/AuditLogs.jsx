import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { systemAPI, departmentAPI } from '../services/api';
import { formatDateTime } from '../utils/helpers';
import useAuthStore from '../stores/authStore';

const AuditLogs = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    keyword: '',
    start_date: '',
    end_date: '',
    result: '',
    department_id: ''
  });

  // 权限守卫：仅管理员可访问
  useEffect(() => {
    if (user && user.role === 'normal_user') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // 获取部门列表
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentAPI.getAll();
        const flattenDepartments = (depts, level = 0) => {
          let result = [];
          depts.forEach(dept => {
            result.push({ ...dept, level });
            if (dept.children && dept.children.length > 0) {
              result = result.concat(flattenDepartments(dept.children, level + 1));
            }
          });
          return result;
        };
        setDepartments(flattenDepartments(response.data || []));
      } catch (error) {
        console.error('获取部门列表失败', error);
      }
    };
    if (user && user.role !== 'normal_user') {
      fetchDepartments();
    }
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (filters.module) params.module = filters.module;
      if (filters.action) params.action = filters.action;
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.result) params.result = filters.result;
      if (filters.department_id) params.department_id = filters.department_id;

      const response = await systemAPI.getAuditLogs(params);
      setLogs(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('获取日志失败', error);
      if (error.response?.status === 403) {
        navigate('/dashboard', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'normal_user') {
      fetchLogs();
    }
  }, [page, user, filters.module, filters.action, filters.keyword, filters.start_date, filters.end_date, filters.result, filters.department_id]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setFilters({
      module: '',
      action: '',
      keyword: '',
      start_date: '',
      end_date: '',
      result: '',
      department_id: ''
    });
    setPage(1);
  };

  const moduleOptions = ['认证', '用户管理', '部门管理', '资产管理', '资产领用', '采购管理', '维修管理', '系统配置', '系统管理'];
  const actionOptions = [
    { value: 'create', label: '新增' },
    { value: 'update', label: '修改' },
    { value: 'delete', label: '删除' },
    { value: 'login', label: '登录' },
    { value: 'logout', label: '登出' },
    { value: 'audit', label: '审核' },
    { value: 'approve', label: '通过' },
    { value: 'reject', label: '驳回' },
    { value: 'deptAudit', label: '部门审核' },
    { value: 'superAudit', label: '终审' },
    { value: 'withdraw', label: '撤回' },
    { value: 'startRepair', label: '开始维修' },
    { value: 'completeRepair', label: '完成维修' },
    { value: 'acceptance', label: '验收' },
  ];
  const resultOptions = [
    { value: 'success', label: '成功' },
    { value: 'fail', label: '失败' }
  ];

  // 权限检查
  if (!user || user.role === 'normal_user') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">权限不足，仅管理员可访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">操作日志</h1>

      {/* 筛选区域 */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 时间范围 */}
            <div>
              <label className="label">开始日期</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="input"
              />
            </div>
            {/* 操作模块 */}
            <div>
              <label className="label">操作模块</label>
              <select
                value={filters.module}
                onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                className="input"
              >
                <option value="">全部</option>
                {moduleOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {/* 操作类型 */}
            <div>
              <label className="label">操作类型</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="input"
              >
                <option value="">全部</option>
                {actionOptions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            {/* 操作人 */}
            <div>
              <label className="label">操作人</label>
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                className="input"
                placeholder="姓名/用户名"
              />
            </div>
            {/* 操作结果 */}
            <div>
              <label className="label">操作结果</label>
              <select
                value={filters.result}
                onChange={(e) => setFilters({ ...filters, result: e.target.value })}
                className="input"
              >
                <option value="">全部</option>
                {resultOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {/* 所属院系 */}
            <div>
              <label className="label">所属院系</label>
              <select
                value={filters.department_id}
                onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
                className="input"
              >
                <option value="">全部</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {'　'.repeat(d.level)}{d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* 按钮区域 */}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={handleReset} className="btn btn-secondary">
              重置
            </button>
            <button type="submit" className="btn btn-primary">
              搜索
            </button>
          </div>
        </form>
      </div>

      {/* 数据表格 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">操作人姓名</th>
                <th className="table-header">用户名</th>
                <th className="table-header">所属院系</th>
                <th className="table-header">操作模块</th>
                <th className="table-header">操作类型</th>
                <th className="table-header">操作详情</th>
                <th className="table-header">操作结果</th>
                <th className="table-header">操作时间</th>
                <th className="table-header">IP地址</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">加载中...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500">暂无数据</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 even:bg-gray-50">
                    <td className="table-cell font-medium">{log.user_name || '-'}</td>
                    <td className="table-cell text-gray-500">{log.user_code || '-'}</td>
                    <td className="table-cell text-gray-500">{log.department_name || '-'}</td>
                    <td className="table-cell">{log.module || '-'}</td>
                    <td className="table-cell">
                      {actionOptions.find(a => a.value === log.action)?.label || log.action || '-'}
                    </td>
                    <td className="table-cell">
                      <div
                        className="max-w-xs truncate cursor-help"
                        title={log.action_name || log.details || '-'}
                      >
                        {log.action_name || log.details || '-'}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.result === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.result === 'success' ? '成功' : '失败'}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 text-sm">{formatDateTime(log.operate_time)}</td>
                    <td className="table-cell text-gray-500 text-sm">{log.ip_address || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-gray-200">
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">第 {page} / {Math.ceil(total / pageSize) || 1} 页</span>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
