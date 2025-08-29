// ステータス判定のヘルパー関数

export function getAccountStatus(
  appLogin: string | null
): "pending" | "active" | "suspended" | "excluded" {
  if (!appLogin) return "excluded";

  const loginValue = appLogin.toString().toLowerCase();

  // 保留中: FarmUp または farmup
  if (loginValue === "farmup") {
    return "pending";
  }

  // アクティブ: true
  if (loginValue === "true") {
    return "active";
  }

  // BAN: suspend または email_ban または Email_BAN
  if (loginValue === "suspend" || loginValue === "email_ban") {
    return "suspended";
  }

  // 除外: false またはその他
  return "excluded";
}

export function getAccountStatus02(
  status: string | null
): "pending" | "active" | "suspended" | "excluded" {
  if (!status) return "excluded";

  const loginValue = status.toString().toLowerCase();

  // 保留中: FarmUp または farmup
  if (loginValue === "farmup") {
    return "pending";
  }

  // アクティブ: true
  if (loginValue === "true") {
    return "active";
  }

  // BAN: suspend または email_ban または Email_BAN
  if (loginValue === "suspend" || loginValue === "email_ban") {
    return "suspended";
  }

  // 除外: false またはその他
  return "excluded";
}

export function getStatusText(
  status: "pending" | "active" | "suspended" | "excluded" | string | null
): string {
  if (!status) return "不明";

  const statusValue = status.toString().toLowerCase();

  // 保留中: FarmUp または farmup
  if (statusValue === "farmup" || statusValue === "pending") {
    return "保留中";
  }

  // アクティブ: true または active
  if (statusValue === "true" || statusValue === "active") {
    return "アクティブ";
  }

  // BAN: suspend または email_ban または Email_BAN または suspended
  if (
    statusValue === "suspend" ||
    statusValue === "email_ban" ||
    statusValue === "suspended"
  ) {
    return "BAN";
  }

  // 除外: false または excluded
  if (
    statusValue === "false" ||
    statusValue === "excluded" ||
    statusValue === "not_found"
  ) {
    return "除外";
  }

  return "不明";
}

export function getStatusBadgeColor(
  status: "pending" | "active" | "suspended" | "excluded" | string | null
): string {
  if (!status) return "bg-gray-100 text-gray-800";

  const statusValue = status.toString().toLowerCase();

  // 保留中: FarmUp または farmup
  if (statusValue === "farmup" || statusValue === "pending") {
    return "bg-yellow-100 text-yellow-800";
  }

  // アクティブ: true または active
  if (statusValue === "true" || statusValue === "active") {
    return "bg-green-100 text-green-800";
  }

  // BAN: suspend または email_ban または Email_BAN または suspended
  if (
    statusValue === "suspend" ||
    statusValue === "email_ban" ||
    statusValue === "suspended"
  ) {
    return "bg-red-100 text-red-800";
  }

  // 除外: false または excluded または not_found
  if (statusValue === "false" || statusValue === "excluded" || statusValue === "not_found") {
    return "bg-gray-100 text-gray-800";
  }

  return "bg-gray-100 text-gray-800";
}

export function getStatusIcon(
  status: "pending" | "active" | "suspended" | "excluded"
) {
  switch (status) {
    case "pending":
      return "Clock";
    case "active":
      return "CheckCircle";
    case "suspended":
      return "XCircle";
    case "excluded":
      return "Minus";
    default:
      return "Help";
  }
}
