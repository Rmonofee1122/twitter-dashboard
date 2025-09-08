// ステータス判定のヘルパー関数

export type StatusType =
  | "active"
  | "shadowban"
  | "stopped"
  | "examination"
  | "not_found"
  | "suspended"
  | "temp_locked";

export function getAccountStatus(
  status: string | null
): StatusType | "unknown" {
  if (!status) return "unknown";

  const statusValue = status.toString().toLowerCase();

  // アクティブ: active
  if (statusValue === "active") {
    return "active";
  }

  // シャドBAN: search_ban または search_suggestion_ban または ghost_ban
  if (
    statusValue === "search_ban" ||
    statusValue === "search_suggestion_ban" ||
    statusValue === "ghost_ban"
  ) {
    return "shadowban";
  }

  // 一時停止: stop
  if (statusValue === "stop") {
    return "stopped";
  }

  // 審査中: examination
  if (statusValue === "examination") {
    return "examination";
  }

  // 未発見: not_found
  if (statusValue === "not_found") {
    return "not_found";
  }

  // 一時制限: temp_locked
  if (statusValue === "temp_locked") {
    return "temp_locked";
  }

  // 凍結: suspend または suspended
  if (statusValue === "suspend" || statusValue === "suspended") {
    return "suspended";
  }

  return "unknown";
}

export function getStatusText(status: string | null): string {
  if (!status) return "不明";

  const statusValue = status.toString().toLowerCase();

  // アクティブ: active
  if (statusValue === "active") {
    return "アクティブ";
  }

  // シャドBAN: search_ban または search_suggestion_ban または ghost_ban
  if (
    statusValue === "search_ban" ||
    statusValue === "search_suggestion_ban" ||
    statusValue === "ghost_ban"
  ) {
    return "シャドBAN";
  }

  // 一時停止: stop
  if (statusValue === "stop") {
    return "一時停止";
  }

  // 審査中: examination
  if (statusValue === "examination") {
    return "審査中";
  }

  // 未発見: not_found
  if (statusValue === "not_found") {
    return "未発見";
  }

  // 一時制限: temp_locked
  if (statusValue === "temp_locked") {
    return "一時制限";
  }

  // 凍結: suspend または suspended
  if (statusValue === "suspend" || statusValue === "suspended") {
    return "凍結";
  }

  return "不明";
}

export function getStatusBadgeColor(status: string | null): string {
  if (!status) return "bg-gray-100 text-gray-800";

  const statusValue = status.toString().toLowerCase();

  // アクティブ: active
  if (statusValue === "active") {
    return "bg-green-100 text-green-800";
  }

  // シャドBAN: search_ban または search_suggestion_ban または ghost_ban
  if (
    statusValue === "search_ban" ||
    statusValue === "search_suggestion_ban" ||
    statusValue === "ghost_ban"
  ) {
    return "bg-orange-100 text-orange-800";
  }

  // 一時停止: stop
  if (statusValue === "stop") {
    return "bg-blue-100 text-blue-800";
  }

  // 審査中: examination
  if (statusValue === "examination") {
    return "bg-yellow-100 text-yellow-800";
  }

  // 未発見: not_found
  if (statusValue === "not_found") {
    return "bg-gray-100 text-gray-800";
  }

  // 一時制限: temp_locked
  if (statusValue === "temp_locked") {
    return "bg-yellow-100 text-yellow-800";
  }

  // 凍結: suspend または suspended
  if (statusValue === "suspend" || statusValue === "suspended") {
    return "bg-red-100 text-red-800";
  }

  return "bg-gray-100 text-gray-800";
}

export function getStatusIcon(status: string | null): string {
  if (!status) return "Help";

  const statusValue = status.toString().toLowerCase();

  // アクティブ: active
  if (statusValue === "active") {
    return "CheckCircle";
  }

  // シャドBAN: search_ban または search_suggestion_ban または ghost_ban
  if (
    statusValue === "search_ban" ||
    statusValue === "search_suggestion_ban" ||
    statusValue === "ghost_ban"
  ) {
    return "AlertTriangle";
  }

  // 一時停止: stop
  if (statusValue === "stop") {
    return "Pause";
  }

  // 審査中: examination
  if (statusValue === "examination") {
    return "Clock";
  }

  // 未発見: not_found
  if (statusValue === "not_found") {
    return "EyeOff";
  }

  // 一時制限: temp_locked
  if (statusValue === "temp_locked") {
    return "Clock3";
  }

  // 凍結: suspend または suspended
  if (statusValue === "suspend" || statusValue === "suspended") {
    return "XCircle";
  }

  return "Help";
}
