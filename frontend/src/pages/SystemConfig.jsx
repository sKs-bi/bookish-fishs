import { useState, useEffect } from 'react';
import { systemAPI } from '../services/api';
import useAppStore from '../stores/appStore';

const SystemConfig = () => {
  const { systemConfigs, fetchSystemConfigs, updateSystemConfigs } = useAppStore();
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSystemConfigs();
  }, []);

  useEffect(() => {
    setConfigs(systemConfigs);
  }, [systemConfigs]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSystemConfigs(configs);
      alert('配置保存成功');
    } catch (error) {
      alert(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">系统配置</h1>

      <div className="card p-4 sm:p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">基础配置</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">系统名称</label>
                <input
                  type="text"
                  value={configs.system_name || ''}
                  onChange={(e) => setConfigs({ ...configs, system_name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">保修到期预警天数</label>
                <input
                  type="number"
                  value={configs.warranty_warning_days || 30}
                  onChange={(e) => setConfigs({ ...configs, warranty_warning_days: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">借用到期预警天数</label>
                <input
                  type="number"
                  value={configs.loan_warning_days || 3}
                  onChange={(e) => setConfigs({ ...configs, loan_warning_days: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">折旧到期预警天数</label>
                <input
                  type="number"
                  value={configs.depreciation_warning_days || 90}
                  onChange={(e) => setConfigs({ ...configs, depreciation_warning_days: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">备份配置</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">自动备份</label>
                <select
                  value={configs.auto_backup_enabled === 'true' ? 'true' : 'false'}
                  onChange={(e) => setConfigs({ ...configs, auto_backup_enabled: e.target.value })}
                  className="input"
                >
                  <option value="true">启用</option>
                  <option value="false">禁用</option>
                </select>
              </div>
              <div>
                <label className="label">自动备份时间</label>
                <input
                  type="time"
                  value={configs.auto_backup_time || '02:00'}
                  onChange={(e) => setConfigs({ ...configs, auto_backup_time: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <button onClick={handleSave} disabled={loading} className="btn btn-primary">
              {loading ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfig;
