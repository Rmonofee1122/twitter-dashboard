/**
 * 日付フォーマット関連のユーティリティ関数
 */

/**
 * 日付文字列を日本語形式でフォーマット
 * 1970年1月1日の場合は「未実行」と表示
 * @param dateString - ISO日付文字列またはnull/undefined
 * @returns フォーマット済みの日付文字列または「未実行」
 */
export const formatDate01 = (dateString: string | null | undefined): string => {
  if (!dateString) return "未実行";

  try {
    const date = new Date(dateString);

    // 1970年1月1日の場合は「未実行」を返す
    if (
      date.getFullYear() === 1970 &&
      date.getMonth() === 0 &&
      date.getDate() === 1
    ) {
      return "未実行";
    }

    // 無効な日付の場合も「未実行」
    if (isNaN(date.getTime())) {
      return "未実行";
    }

    // 正常な日付の場合は日本語形式でフォーマット
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "未実行";
  }
};

/**
 * 日付文字列を短縮形式でフォーマット（日付のみ）
 * @param dateString - ISO日付文字列またはnull/undefined
 * @returns フォーマット済みの日付文字列または「未実行」
 */
export const formatDateShort = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "未実行";

  try {
    const date = new Date(dateString);

    // 1970年1月1日の場合は「未実行」を返す
    if (
      date.getFullYear() === 1970 &&
      date.getMonth() === 0 &&
      date.getDate() === 1
    ) {
      return "未実行";
    }

    // 無効な日付の場合も「未実行」
    if (isNaN(date.getTime())) {
      return "未実行";
    }

    // 正常な日付の場合は日付のみフォーマット
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (error) {
    return "未実行";
  }
};

/**
 * 相対時間を表示（例：「3分前」「2時間前」「1日前」）
 * @param dateString - ISO日付文字列またはnull/undefined
 * @returns 相対時間文字列または「未実行」
 */
export const formatRelativeTime = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "未実行";

  try {
    const date = new Date(dateString);
    const now = new Date();

    // 1970年1月1日の場合は「未実行」を返す
    if (
      date.getFullYear() === 1970 &&
      date.getMonth() === 0 &&
      date.getDate() === 1
    ) {
      return "未実行";
    }

    // 無効な日付の場合も「未実行」
    if (isNaN(date.getTime())) {
      return "未実行";
    }

    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "たった今";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 30) {
      return `${diffDays}日前`;
    } else {
      // 30日以上前の場合は通常の日付表示
      return formatDateShort(dateString);
    }
  } catch (error) {
    return "未実行";
  }
};

/**
 * 日付文字列をISO形式に変換
 * @param dateString - 日付文字列
 * @returns ISO形式の日付文字列またはnull
 */
export const toISOString = (
  dateString: string | null | undefined
): string | null => {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  } catch (error) {
    return null;
  }
};

/**
 * 日付範囲の文字列を生成
 * @param startDate - 開始日
 * @param endDate - 終了日
 * @returns 日付範囲の文字列
 */
export const formatDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string => {
  if (!startDate && !endDate) return "全期間";
  if (startDate && !endDate) return `${formatDateShort(startDate)}以降`;
  if (!startDate && endDate) return `${formatDateShort(endDate)}以前`;
  return `${formatDateShort(startDate)} ～ ${formatDateShort(endDate)}`;
};

/**
 * 現在時刻をISO文字列で取得
 * @returns 現在時刻のISO文字列
 */
export const getCurrentISOString = (): string => {
  return new Date().toISOString();
};

/**
 * 指定した日数前の日付をISO文字列で取得
 * @param days - 何日前か
 * @returns 指定日数前の日付のISO文字列
 */
export const getDaysAgoISOString = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

/**
 * UTC日付を東京標準時刻に変換してフォーマット
 * 1970年1月1日の場合は「未実行」と表示
 * @param dateString - ISO日付文字列（UTC）またはnull/undefined
 * @returns 東京時間でフォーマット済みの日付文字列または「未実行」
 */
export const formatDateLocal = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "未実行";

  try {
    const date = new Date(dateString);

    // 1970年1月1日の場合は「未実行」を返す
    if (
      date.getFullYear() === 1970 &&
      date.getMonth() === 0 &&
      date.getDate() === 1
    ) {
      return "未実行";
    }

    // 無効な日付の場合も「未実行」
    if (isNaN(date.getTime())) {
      return "未実行";
    }

    // dateに9:00を加算
    date.setHours(date.getHours() + 9);

    // UTC時刻を東京時間（Asia/Tokyo）に変換してフォーマット
    return date.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "未実行";
  }
};

/**
 * UTC日付を東京時間の短縮形式でフォーマット（日付のみ）
 * @param dateString - ISO日付文字列（UTC）またはnull/undefined
 * @returns 東京時間でフォーマット済みの日付文字列または「未実行」
 */
export const formatDateLocalShort = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "未実行";

  try {
    const date = new Date(dateString);

    // 1970年1月1日の場合は「未実行」を返す
    if (
      date.getFullYear() === 1970 &&
      date.getMonth() === 0 &&
      date.getDate() === 1
    ) {
      return "未実行";
    }

    // 無効な日付の場合も「未実行」
    if (isNaN(date.getTime())) {
      return "未実行";
    }

    // UTC時刻を東京時間に変換して日付のみフォーマット
    return date.toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (error) {
    return "未実行";
  }
};

/**
 * 東京時間での現在時刻を取得
 * @returns 東京時間の現在時刻文字列
 */
export const getCurrentTokyoTime = (): string => {
  const now = new Date();
  return now.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
