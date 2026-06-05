import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetAPI } from '../services/api';
import { formatDate, formatCurrency, getStatusBadgeClass, getStatusText } from '../utils/helpers';
import { QRCodeSVG } from 'qrcode.react';

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAsset = async () => {
    try {
      const response = await assetAPI.getById(id);
      setAsset(response.data);
    } catch (error) {
      console.error('获取资产详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (!asset) {
    return <div className="text-center py-8 text-gray-500">资产不存在</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate('/assets')} className="mr-4 text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">资产详情</h1>
        </div>
        <span className={`badge ${getStatusBadgeClass(asset.status)} text-base px-4 py-2`}>
          {getStatusText(asset.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">基本信息</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">资产编号</p>
                <p className="font-mono font-medium">{asset.asset_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">序列号</p>
                <p className="font-medium">{asset.serial_number || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">资产名称</p>
                <p className="font-medium text-lg">{asset.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">资产类型</p>
                <p className="font-medium">{asset.type?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">品牌型号</p>
                <p className="font-medium">{asset.brand || '-'} {asset.model || ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">规格参数</p>
                <p className="font-medium">{asset.spec || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">存放位置</p>
                <p className="font-medium">{asset.location || '-'}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">财务信息</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">购置日期</p>
                <p className="font-medium">{formatDate(asset.purchase_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">购置价格</p>
                <p className="font-medium text-lg text-primary">{formatCurrency(asset.purchase_price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">当前净值</p>
                <p className="font-medium">{formatCurrency(asset.net_value)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">供应商</p>
                <p className="font-medium">{asset.supplier || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">发票号</p>
                <p className="font-medium">{asset.invoice_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">保修截止日期</p>
                <p className="font-medium">{formatDate(asset.warranty_end_date)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">责任信息</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">所属部门</p>
                <p className="font-medium">{asset.department?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">责任人</p>
                <p className="font-medium">{asset.responsible?.real_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">联系电话</p>
                <p className="font-medium">{asset.responsible?.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">电子邮箱</p>
                <p className="font-medium">{asset.responsible?.email || '-'}</p>
              </div>
            </div>
          </div>

          {asset.remarks && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">备注</h2>
              <p className="text-gray-600">{asset.remarks}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">资产二维码</h2>
            <div className="flex justify-center bg-white p-4 rounded-lg border">
              <QRCodeSVG value={JSON.stringify({ type: 'asset', id: asset.id, code: asset.asset_code })} size={180} />
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              扫描二维码查看资产信息
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">操作记录</h2>
            <div className="text-center text-gray-500">
              暂无操作记录
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;
