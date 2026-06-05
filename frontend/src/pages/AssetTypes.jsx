import { useState, useEffect } from 'react';
import { assetAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const AssetTypes = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', depreciation_years: 5 });
  const { user } = useAuthStore();

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const response = await assetAPI.getTypes();
      setTypes(response.data || []);
    } catch (error) {
      console.error('获取类型列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await assetAPI.createType(formData);
      setShowModal(false);
      setFormData({ name: '', code: '', depreciation_years: 5 });
      fetchTypes();
    } catch (error) {
      alert(error.message || '创建失败');
    }
  };

  const handleDeleteClick = (type) => {
    setDeleteTarget(type);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await assetAPI.deleteType(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchTypes();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">资产类型</h1>
        {user?.role === 'super_admin' && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            新增类型
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : types.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无数据</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4">
            {types.map((type) => (
              <div key={type.id} className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-5 border border-gray-200 hover:border-red-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-white text-sm font-bold shadow-md">
                        {type.name.charAt(0)}
                      </span>
                      <h3 className="font-semibold text-gray-800 truncate">{type.name}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">编码: {type.code || '-'}</p>
                    <p className="text-xs sm:text-sm text-gray-500">折旧年限: {type.depreciation_years}年</p>
                    <p className="text-xs text-gray-400 mt-1">资产数量: {type.asset_count || 0}</p>
                  </div>
                  {user?.role === 'super_admin' && (
                    <button
                      onClick={() => handleDeleteClick(type)}
                      className="opacity-0 group-hover:opacity-100 ml-2 p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all duration-300 transform hover:scale-110"
                      title="删除"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md my-4 mx-2">
            <h2 className="text-lg sm:text-xl font-bold mb-4">新增资产类型</h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="label">类型名称 *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">类型编码</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">折旧年限</label>
                <input type="number" value={formData.depreciation_years} onChange={(e) => setFormData({ ...formData, depreciation_years: e.target.value })} className="input" />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                <button type="submit" className="btn btn-primary flex-1">保存</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm my-4 mx-2 shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">确认删除</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-1">确定要删除资产类型</p>
              <p className="text-base sm:text-lg font-semibold text-gray-800 mb-4">"{deleteTarget.name}"</p>
              <p className="text-xs sm:text-sm text-red-500 mb-6">此操作不可逆，请谨慎操作</p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleDelete}
                  className="w-full sm:flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  确认删除
                </button>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                  className="w-full sm:flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetTypes;
