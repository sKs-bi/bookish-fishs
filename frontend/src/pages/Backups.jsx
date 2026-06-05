import { useState, useEffect } from 'react';
import { systemAPI } from '../services/api';
import { formatDateTime } from '../utils/helpers';

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await systemAPI.getBackups({ page, pageSize });
      setBackups(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('获取备份列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [page]);

  const handleBackup = async () => {
    if (!window.confirm('确定要创建备份吗？')) return;
    try {
      await systemAPI.createBackup();
      fetchBackups();
      alert('备份创建成功');
    } catch (error) {
      alert(error.message || '备份失败');
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm('确定要恢复该备份吗？这将覆盖当前所有数据！')) return;
    try {
      await systemAPI.restoreBackup(id);
      alert('数据恢复成功');
    } catch (error) {
      alert(error.message || '恢复失败');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">数据备份</h1>
        <button onClick={handleBackup} className="btn btn-primary">
          创建备份
        </button>
      </div>

      <div className="card p-4 text-sm text-gray-600">
        <p>• 建议定期进行数据备份，以防数据丢失</p>
        <p>• 自动备份时间：每天凌晨2:00</p>
        <p>• 恢复备份将覆盖当前所有数据，请谨慎操作</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">备份名称</th>
                <th className="table-header">备份类型</th>
                <th className="table-header">文件大小</th>
                <th className="table-header">状态</th>
                <th className="table-header">备份时间</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8">加载中...</td></tr>
              ) : backups.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">暂无备份记录</td></tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{backup.backup_name}</td>
                    <td className="table-cell">
                      <span className={`badge ${backup.backup_type === 'auto' ? 'badge-gray' : 'badge-primary'}`}>
                        {backup.backup_type === 'auto' ? '自动' : '手动'}
                      </span>
                    </td>
                    <td className="table-cell">{formatFileSize(backup.backup_size)}</td>
                    <td className="table-cell">
                      <span className={`badge ${backup.status === 'success' ? 'badge-success' : 'badge-danger'}`}>
                        {backup.status === 'success' ? '成功' : '失败'}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">{formatDateTime(backup.created_at)}</td>
                    <td className="table-cell">
                      {backup.status === 'success' && (
                        <button onClick={() => handleRestore(backup.id)} className="text-blue-600 hover:text-blue-800 text-sm">
                          恢复
                        </button>
                      )}
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

export default Backups;
