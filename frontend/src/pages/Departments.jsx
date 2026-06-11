import { useState, useEffect } from 'react';
import { departmentAPI } from '../services/api';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', parent_id: '', manager_id: '' });
  const [parentOptions, setParentOptions] = useState([]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await departmentAPI.list();
      setDepartments(response.data || []);
      setParentOptions(response.data || []);
    } catch (error) {
      console.error('获取部门列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await departmentAPI.update(editingDept.id, formData);
      } else {
        await departmentAPI.create(formData);
      }
      setShowModal(false);
      setEditingDept(null);
      setFormData({ name: '', code: '', parent_id: '', manager_id: '' });
      fetchDepartments();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code || '',
      parent_id: dept.parent_id || '',
      manager_id: dept.manager_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该部门吗？')) return;
    try {
      await departmentAPI.delete(id);
      fetchDepartments();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };

  const renderTree = (items, level = 0) => {
    return items.map(item => (
      <div key={item.id}>
        <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 border-b border-gray-100">
          <div className="flex items-center" style={{ paddingLeft: level * 24 }}>
            <span className="text-gray-400 mr-2">├─</span>
            <span className="font-medium">{item.name}</span>
            <span className="ml-3 text-sm text-gray-400">({item.code || '-'})</span>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 text-sm">删除</button>
          </div>
        </div>
        {item.children && item.children.length > 0 && renderTree(item.children, level + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">部门管理</h1>
        <button onClick={() => { setEditingDept(null); setFormData({ name: '', code: '', parent_id: '', manager_id: '' }); setShowModal(true); }} className="btn btn-primary">
          新增部门
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : departments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无数据</div>
        ) : (
          renderTree(departments)
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingDept ? '编辑部门' : '新增部门'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">部门名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">部门编码</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">上级部门</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="input"
                >
                  <option value="">无</option>
                  {parentOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">保存</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
