import { useState, useEffect } from 'react';
import { systemAPI } from '../services/api';
import { formatDateTime } from '../utils/helpers';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ module: '', action: '', keyword: '' });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await systemAPI.getAuditLogs({ page, pageSize, ...filters });
      setLogs(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('获取日志失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const moduleOptions = ['认证', '用户管理', '部门管理', '资产管理', '资产领用', '采购管理', '维修管理', '系统配置', '系统管理'];
  const actionOptions = [
    { value: 'create', label: '创建' },
    { value: 'update', label: '更新' },
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">审计日志</h1>

      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="w-36">
            <label className="label">模块</label>
            <select value={filters.module} onChange={(e) => setFilters({ ...filters, module: e.target.value })} className="input">
              <option value="">全部</option>
              {moduleOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="label">操作类型</label>
            <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="input">
              <option value="">全部</option>
              {actionOptions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="label">关键词</label>
            <input type="text" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} className="input" placeholder="操作人姓名、工号..." />
          </div>
          <button type="submit" className="btn btn-primary">搜索</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">操作时间</th>
                <th className="table-header">操作人</th>
                <th className="table-header">模块</th>
                <th className="table-header">操作类型</th>
                <th className="table-header">操作名称</th>
                <th className="table-header">IP地址</th>
                <th className="table-header">结果</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8">加载中...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">暂无数据</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="table-cell text-gray-500">{formatDateTime(log.operate_time)}</td>
                    <td className="table-cell">
                      <p className="font-medium">{log.user_name}</p>
                      <p className="text-xs text-gray-400">{log.user_code}</p>
                    </td>
                    <td className="table-cell">{log.module}</td>
                    <td className="table-cell">{log.action_name || actionOptions.find(a => a.value === log.action)?.label || log.action}</td>
                    <td className="table-cell">{log.action_name || '-'}</td>
                    <td className="table-cell text-gray-500">{log.ip_address || '-'}</td>
                    <td className="table-cell">
                      <span className={`badge ${log.result === 'success' ? 'badge-success' : 'badge-danger'}`}>
                        {log.result === 'success' ? '成功' : '失败'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
          <div className="flex space-x-2">
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn btn-secondary">上一页</button>
            <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / pageSize)} className="btn btn-secondary">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
