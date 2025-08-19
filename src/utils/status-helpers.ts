// ステータス判定のヘルパー関数

export function getAccountStatus(appLogin: string | null): 'pending' | 'active' | 'suspended' | 'excluded' {
  if (!appLogin) return 'excluded';
  
  const loginValue = appLogin.toString().toLowerCase();
  
  // 保留中: FarmUp または farmup
  if (loginValue === 'farmup') {
    return 'pending';
  }
  
  // アクティブ: true
  if (loginValue === 'true') {
    return 'active';
  }
  
  // BAN: suspend または email_ban または Email_BAN
  if (loginValue === 'suspend' || loginValue === 'email_ban') {
    return 'suspended';
  }
  
  // 除外: false またはその他
  return 'excluded';
}

export function getStatusText(status: 'pending' | 'active' | 'suspended' | 'excluded'): string {
  switch (status) {
    case 'pending':
      return '保留中';
    case 'active':
      return 'アクティブ';
    case 'suspended':
      return 'BAN';
    case 'excluded':
      return '除外';
    default:
      return '不明';
  }
}

export function getStatusBadgeColor(status: 'pending' | 'active' | 'suspended' | 'excluded'): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'suspended':
      return 'bg-red-100 text-red-800';
    case 'excluded':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusIcon(status: 'pending' | 'active' | 'suspended' | 'excluded') {
  switch (status) {
    case 'pending':
      return 'Clock';
    case 'active':
      return 'CheckCircle';
    case 'suspended':
      return 'XCircle';
    case 'excluded':
      return 'Minus';
    default:
      return 'Help';
  }
}