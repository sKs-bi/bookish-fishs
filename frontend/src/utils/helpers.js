import dayjs from 'dayjs';

export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '-';
  return Number(num).toFixed(decimals);
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return `¥${Number(amount).toFixed(2)}`;
};

export const getStatusText = (status) => {
  const statusMap = {
    'active': '正常',
    'inactive': '待审核',
    'frozen': '已冻结',
    'pending': '待审核',
    'pending_delete': '待删除',
    'idle': '正常',
    'in_use': '正常',
    'repairing': '维修中',
    'in_repair': '维修中',
    'transferred': '正常',
    'scrapped': '报废',
    'approved': '已通过',
    'rejected': '已驳回',
    'returned': '已归还',
    'overdue': '已逾期',
    'cancelled': '已取消',
    'withdrawn': '已撤回',
    'draft': '草稿',
    'dept_pending': '部门待审',
    
    'from_approved': '调出已审',
    'to_approved': '调入已审',
    'super_approved': '终审已审',
    'completed': '已完成',
    'in_progress': '进行中',
    'verified': '已核销',
  };
  return statusMap[status] || status;
};

export const getStatusBadgeClass = (status) => {
  const classMap = {
    'active': 'badge-success',
    'inactive': 'badge-warning',
    'frozen': 'badge-danger',
    'pending': 'badge-warning',
    'pending_delete': 'badge-danger',
    'idle': 'badge-success',
    'in_use': 'badge-success',
    'repairing': 'badge-warning',
    'in_repair': 'badge-warning',
    'transferred': 'badge-success',
    'scrapped': 'badge-gray',
    'approved': 'badge-success',
    'rejected': 'badge-danger',
    'returned': 'badge-success',
    'overdue': 'badge-danger',
    'cancelled': 'badge-gray',
    'withdrawn': 'badge-gray',
    'draft': 'badge-gray',
    'dept_pending': 'badge-warning',
    
    'completed': 'badge-success',
    'in_progress': 'badge-primary',
    'verified': 'badge-success',
  };
  return classMap[status] || 'badge-gray';
};

export const getRoleText = (role) => {
  const roleMap = {
    'super_admin': '超级管理员',
    'dept_admin': '部门管理员',
    'normal_user': '普通用户',
  };
  return roleMap[role] || role;
};

export const getRoleBadgeClass = (role) => {
  const classMap = {
    'super_admin': 'bg-purple-100 text-purple-800',
    'dept_admin': 'bg-blue-100 text-blue-800',
    'normal_user': 'bg-gray-100 text-gray-800',
  };
  return classMap[role] || 'badge-gray';
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const validateChineseIdCard = (idCard) => {
  const reg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
  return reg.test(idCard);
};

export const validatePhone = (phone) => {
  const reg = /^1[3-9]\d{9}$/;
  return reg.test(phone);
};

export const validateEmail = (email) => {
  const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return reg.test(email);
};

export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  const XLSX = window.XLSX;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
