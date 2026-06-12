import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../stores/appStore';
import { formatCurrency } from '../utils/helpers';

const Dashboard = () => {
  const navigate = useNavigate();
  const { statistics, fetchStatistics } = useAppStore();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    if (statistics?.statusDistribution && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }

      chartInstance.current = echarts.init(chartRef.current);

      const statusColorMap = {
        '正常': '#3B82F6',
        '维修中': '#22C55E',
        '报废': '#EF4444'
      };

      const processedData = {};
      statistics.statusDistribution.forEach(item => {
        const statusName = item.status === 'idle' || item.status === 'in_use' || item.status === 'transferred' ? '正常' : item.status === 'repairing' ? '维修中' : '报废';
        if (!processedData[statusName]) {
          processedData[statusName] = 0;
        }
        processedData[statusName] += item.count;
      });

      const chartData = Object.entries(processedData).map(([name, value]) => ({
        name,
        value,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: statusColorMap[name] },
            { offset: 1, color: statusColorMap[name] + '99' }
          ])
        }
      }));

      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: {
            color: '#374151',
            fontSize: 14
          },
          formatter: (params) => {
            return `<div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${statusColorMap[params.name]};"></span>
                      <span>数量: <strong>${params.value}</strong> 台</span>
                    </div>
                    <div style="margin-top: 4px; color: #6b7280;">占比: ${params.percent}%</div>`;
          }
        },
        legend: {
          orient: 'horizontal',
          bottom: '0%',
          left: 'center',
          itemWidth: 16,
          itemHeight: 16,
          itemGap: 24,
          textStyle: {
            fontSize: 14,
            color: '#4b5563',
            padding: [0, 0, 0, 8]
          },
          formatter: (name) => {
            const item = chartData.find(d => d.name === name);
            return `${name}  ${item ? item.value : 0}台`;
          }
        },
        series: [{
          type: 'pie',
          radius: ['38%', '62%'],
          center: ['50%', '48%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 12,
            borderColor: '#fff',
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.1)'
          },
          label: {
            show: true,
            position: 'outside',
            formatter: (params) => {
              const color = statusColorMap[params.name] || '#374151';
              return `{name|${params.name}}\n{value|${params.value}台}`;
            },
            rich: {
              name: {
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                padding: [4, 0, 0, 0]
              },
              value: {
                fontSize: 18,
                fontWeight: 'bold',
                color: '#3B82F6',
                padding: [2, 0, 4, 0]
              }
            },
            lineHeight: 20
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
            smooth: true,
            lineStyle: {
              width: 2
            }
          },
          emphasis: {
            scale: true,
            scaleSize: 10,
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            },
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          data: chartData,
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: (idx) => idx * 100
        }],
        graphic: {
          elements: [{
            type: 'text',
            left: 'center',
            top: '40%',
            style: {
              text: '资产状态',
              textAlign: 'center',
              fill: '#9ca3af',
              fontSize: 14
            }
          }, {
            type: 'text',
            left: 'center',
            top: '45%',
            style: {
              text: String(chartData.reduce((sum, item) => sum + item.value, 0)),
              textAlign: 'center',
              fill: '#1f2937',
              fontSize: 18,
              fontWeight: 'bold'
            }
          }, {
            type: 'text',
            left: 'center',
            top: '52%',
            style: {
              text: '台',
              textAlign: 'center',
              fill: '#6b7280',
              fontSize: 13
            }
          }]
        }
      };
      chartInstance.current.setOption(option);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, [statistics]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const statCards = [
    { title: '资产总数', value: statistics?.overview?.totalAssets || 0, color: 'bg-blue-500', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { title: '正常资产', value: (statistics?.overview?.idleAssets || 0) + (statistics?.overview?.inUseAssets || 0), color: 'bg-green-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: '维修中', value: statistics?.overview?.repairingAssets || 0, color: 'bg-yellow-500', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { title: '总资产价值', value: formatCurrency(statistics?.overview?.totalValue || 0), color: 'bg-purple-500', icon: '¥', isText: true },
  ];

  const pendingCards = [
    { title: '待审批采购', value: statistics?.overview?.pendingPurchases || 0, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: '待审批维修', value: statistics?.overview?.pendingRepairs || 0, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: '待处理领用', value: statistics?.overview?.pendingLoans || 0, color: 'text-green-500', bg: 'bg-green-50' },
    { title: '逾期未还', value: statistics?.overview?.overdueLoans || 0, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const quickActions = [
    { label: '新增资产', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', color: 'blue', path: '/assets' },
    { label: '采购申请', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'green', path: '/purchases' },
    { label: '提交报修', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'orange', path: '/repairs' },
    { label: '资产调拨', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', color: 'purple', path: '/assets' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">仪表盘</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className={`${card.color} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
                {card.isText ? (
                  <span className="text-white font-bold text-lg sm:text-xl">{card.icon}</span>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                  </svg>
                )}
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{card.title}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {pendingCards.map((card, index) => (
          <div key={index} className={`${card.bg} rounded-lg p-2 sm:p-3 lg:p-4`}>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{card.title}</p>
            <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-3 sm:p-4 lg:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">资产状态分布</h2>
          <div ref={chartRef} className="h-64 sm:h-72 lg:h-80"></div>
        </div>

        <div className="card p-3 sm:p-4 lg:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">快捷操作</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`p-3 sm:p-4 bg-${action.color}-50 rounded-lg text-center hover:bg-${action.color}-100 transition-colors`}
              >
                <svg className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto text-${action.color}-500 mb-1 sm:mb-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
                <span className="text-xs sm:text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
