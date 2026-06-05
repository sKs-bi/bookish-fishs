import { useState } from 'react';
import { formatDateTime } from '../utils/helpers';

const RejectionModal = ({ rejection, onClose, onReapply, onMarkRead }) => {
  const [loading, setLoading] = useState(false);

  const handleKnowIt = async () => {
    setLoading(true);
    try {
      await onMarkRead(rejection.id);
      onClose();
    } catch (error) {
      console.error('标记已读失败', error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleReapply = () => {
    onReapply(rejection);
    onClose();
  };

  const getTypeText = (type) => {
    return type === 'create' ? '新增资产' : '删除资产';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-red-100 to-orange-200 mb-3">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">您的资产操作申请已被驳回</h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4">
            <div className="flex items-start">
              <span className="text-gray-500 text-sm w-20 flex-shrink-0">申请类型:</span>
              <span className="text-gray-900 font-medium text-sm">{getTypeText(rejection.rejection_type)}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-500 text-sm w-20 flex-shrink-0">资产编号:</span>
              <span className="text-gray-900 font-mono text-sm">{rejection.asset_code || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-500 text-sm w-20 flex-shrink-0">资产名称:</span>
              <span className="text-gray-900 font-medium text-sm">{rejection.asset_name || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-500 text-sm w-20 flex-shrink-0">驳回人:</span>
              <span className="text-gray-900 text-sm">{rejection.rejector?.real_name || rejection.rejector?.username || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-500 text-sm w-20 flex-shrink-0">驳回时间:</span>
              <span className="text-gray-900 text-sm">{formatDateTime(rejection.rejected_at)}</span>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="text-red-600 text-sm font-semibold">驳回原因:</span>
                <p className="text-red-700 font-bold text-sm mt-1">{rejection.reason}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleKnowIt}
              disabled={loading}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              我知道了
            </button>
            {rejection.rejection_type === 'create' && rejection.original_data && (
              <button
                onClick={handleReapply}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
              >
                重新申请
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;
