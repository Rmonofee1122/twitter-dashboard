// MaxListenersの警告を防ぐための設定
// Trigger.devのワーカーが複数のイベントリスナーを登録するため、
// デフォルトの上限（10）を増やす
if (typeof process !== 'undefined' && process.setMaxListeners) {
  process.setMaxListeners(20);
}

// Trigger.devのタスクをエクスポート
export * from "./example";