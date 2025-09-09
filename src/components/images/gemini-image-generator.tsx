"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, Send, Loader, Upload, FileText, Clock, Play, Pause, RefreshCw } from "lucide-react";

interface GeminiImageGeneratorProps {
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
}

const GeminiImageGenerator = memo(function GeminiImageGenerator({
  onImageGenerated,
}: GeminiImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [currentBulkPrompt, setCurrentBulkPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<"single" | "bulk" | "scheduler">("single");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // スケジューラー関連の状態
  const [schedulerFile, setSchedulerFile] = useState<File | null>(null);
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const [schedulerInterval, setSchedulerInterval] = useState(10); // 分
  const [schedulerProgress, setSchedulerProgress] = useState({ current: 0, total: 0 });
  const [nextExecutionTime, setNextExecutionTime] = useState<Date | null>(null);
  const [currentSchedulerPrompt, setCurrentSchedulerPrompt] = useState("");
  const [schedulerStatus, setSchedulerStatus] = useState<"idle" | "running" | "waiting">("idle");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const schedulerFileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      alert("プロンプトを入力してください");
      return;
    }

    const trimmedPrompt = prompt.trim();
    console.log(`🚀 単体生成開始: "${trimmedPrompt}"`);

    setIsGenerating(true);
    try {
      // 1. 画像生成
      console.log("📷 画像生成APIを呼び出し中...");
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ 画像生成API失敗 (${response.status}): ${errorText}`);
        throw new Error("画像生成に失敗しました");
      }

      const result = await response.json();
      console.log("✅ 画像生成成功:", result);

      if (result.success && result.imageUrl) {
        // 2. R2にアップロード
        try {
          console.log(`📥 生成画像をダウンロード中: ${result.imageUrl}`);
          const imageResponse = await fetch(result.imageUrl);
          
          if (!imageResponse.ok) {
            console.error(`❌ 画像ダウンロード失敗 (${imageResponse.status})`);
            // ダウンロードに失敗した場合は元のURLでコールバック
            onImageGenerated?.(result.imageUrl, trimmedPrompt);
            return;
          }

          const imageBlob = await imageResponse.blob();
          console.log(`📦 画像サイズ: ${imageBlob.size} bytes`);
          
          // 3. Base64変換
          console.log("🔄 Base64変換中...");
          const reader = new FileReader();
          const base64Promise = new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Base64変換失敗"));
            reader.readAsDataURL(imageBlob);
          });
          const imageBase64 = await base64Promise as string;
          console.log(`✅ Base64変換完了 (${imageBase64.length} 文字)`);
          
          // 4. R2アップロード
          console.log("☁️ R2アップロード開始...");
          const uploadResponse = await fetch("/api/upload-generated-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageBase64,
              prompt: trimmedPrompt,
            }),
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            console.log(`🎉 R2アップロード成功: ${uploadResult.key}`);
            console.log(`🔗 保存URL: ${uploadResult.url}`);
            onImageGenerated?.(uploadResult.url, trimmedPrompt);
          } else {
            const uploadError = await uploadResponse.text();
            console.error(`❌ R2アップロード失敗 (${uploadResponse.status}): ${uploadError}`);
            // R2アップロードに失敗した場合は元のURLでコールバック
            alert("R2への保存に失敗しましたが、画像生成は成功しました");
            onImageGenerated?.(result.imageUrl, trimmedPrompt);
          }
        } catch (uploadError) {
          console.error("❌ R2アップロード処理エラー:", uploadError);
          alert("R2への保存に失敗しましたが、画像生成は成功しました");
          // アップロード処理に失敗した場合は元のURLでコールバック
          onImageGenerated?.(result.imageUrl, trimmedPrompt);
        }
      } else {
        console.error("❌ 画像生成結果が不正:", result);
        throw new Error("画像URLの取得に失敗しました");
      }
    } catch (error) {
      console.error("💥 単体生成エラー:", error);
      alert("画像生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, onImageGenerated]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === "text/plain") {
        setSelectedFile(file);
      } else {
        alert("テキストファイル(.txt)を選択してください");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    []
  );

  const handleBulkGenerate = useCallback(async () => {
    if (!selectedFile) {
      alert("テキストファイルを選択してください");
      return;
    }

    setIsBulkGenerating(true);
    try {
      const text = await selectedFile.text();
      const prompts = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (prompts.length === 0) {
        alert("有効なプロンプトが見つかりませんでした");
        return;
      }

      setBulkProgress({ current: 0, total: prompts.length });

      for (let i = 0; i < prompts.length; i++) {
        const currentPrompt = prompts[i];
        setCurrentBulkPrompt(currentPrompt);
        setBulkProgress({ current: i + 1, total: prompts.length });

        try {
          const response = await fetch("/api/generate-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: currentPrompt }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.imageUrl) {
              // 生成された画像をR2にアップロード
              try {
                const imageResponse = await fetch(result.imageUrl);
                const imageBlob = await imageResponse.blob();
                
                // BlobをBase64に変換
                const reader = new FileReader();
                const base64Promise = new Promise((resolve) => {
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(imageBlob);
                });
                const imageBase64 = await base64Promise as string;
                
                // R2にアップロード
                const uploadResponse = await fetch("/api/upload-generated-image", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    imageBase64,
                    prompt: currentPrompt,
                  }),
                });
                
                if (uploadResponse.ok) {
                  const uploadResult = await uploadResponse.json();
                  console.log(`画像をR2に保存: ${uploadResult.key}`);
                  onImageGenerated?.(uploadResult.url, currentPrompt);
                } else {
                  console.error(`R2アップロード失敗 "${currentPrompt}":`, await uploadResponse.text());
                  // アップロードに失敗しても元のURLでコールバックは呼ぶ
                  onImageGenerated?.(result.imageUrl, currentPrompt);
                }
              } catch (uploadError) {
                console.error(`R2アップロードエラー "${currentPrompt}":`, uploadError);
                // アップロードに失敗しても元のURLでコールバックは呼ぶ
                onImageGenerated?.(result.imageUrl, currentPrompt);
              }
            } else {
              console.error(
                `プロンプト "${currentPrompt}" の生成に失敗しました: レスポンス内容が不正`
              );
            }
          } else {
            console.error(
              `プロンプト "${currentPrompt}" の生成に失敗しました: HTTP ${response.status}`
            );
          }
        } catch (error) {
          console.error(`プロンプト "${currentPrompt}" の生成エラー:`, error);
        }

        // 次の生成まで少し待機（API制限対策）
        if (i < prompts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      alert(`${prompts.length}個の画像生成が完了しました`);
    } catch (error) {
      console.error("一括生成エラー:", error);
      alert("一括生成に失敗しました");
    } finally {
      setIsBulkGenerating(false);
      setBulkProgress({ current: 0, total: 0 });
      setCurrentBulkPrompt("");
    }
  }, [selectedFile, onImageGenerated]);

  // スケジューラー用のファイル選択
  const handleSchedulerFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === "text/plain") {
        setSchedulerFile(file);
      } else {
        alert("テキストファイル(.txt)を選択してください");
        if (schedulerFileInputRef.current) {
          schedulerFileInputRef.current.value = "";
        }
      }
    },
    []
  );

  // 単一プロンプトの処理（スケジューラー用）
  const processSchedulerPrompt = useCallback(async (prompt: string) => {
    console.log(`🚀 スケジューラー: プロンプト処理開始 - "${prompt}"`);
    
    try {
      // 1. 画像生成
      console.log(`📷 画像生成APIを呼び出し中...`);
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ 画像生成API失敗 (${response.status}): ${errorText}`);
        return false;
      }

      const result = await response.json();
      console.log(`✅ 画像生成成功:`, result);

      if (result.success && result.imageUrl) {
        // 2. 画像ダウンロード
        console.log(`📥 生成画像をダウンロード中: ${result.imageUrl}`);
        try {
          const imageResponse = await fetch(result.imageUrl);
          if (!imageResponse.ok) {
            console.error(`❌ 画像ダウンロード失敗 (${imageResponse.status})`);
            return false;
          }

          const imageBlob = await imageResponse.blob();
          console.log(`📦 画像サイズ: ${imageBlob.size} bytes`);
          
          // 3. Base64変換
          console.log(`🔄 Base64変換中...`);
          const reader = new FileReader();
          const base64Promise = new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Base64変換失敗"));
            reader.readAsDataURL(imageBlob);
          });
          const imageBase64 = await base64Promise as string;
          console.log(`✅ Base64変換完了 (${imageBase64.length} 文字)`);
          
          // 4. R2アップロード
          console.log(`☁️ R2アップロード開始...`);
          const uploadResponse = await fetch("/api/upload-generated-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageBase64,
              prompt,
            }),
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            console.log(`🎉 R2アップロード成功: ${uploadResult.key}`);
            console.log(`🔗 保存URL: ${uploadResult.url}`);
            onImageGenerated?.(uploadResult.url, prompt);
            return true;
          } else {
            const uploadError = await uploadResponse.text();
            console.error(`❌ R2アップロード失敗 (${uploadResponse.status}): ${uploadError}`);
            // フォールバック: 元のURLでコールバック
            onImageGenerated?.(result.imageUrl, prompt);
            return true;
          }
        } catch (uploadError) {
          console.error(`❌ R2アップロード処理エラー:`, uploadError);
          // フォールバック: 元のURLでコールバック
          onImageGenerated?.(result.imageUrl, prompt);
          return true;
        }
      } else {
        console.error(`❌ 画像生成結果が不正:`, result);
        return false;
      }
    } catch (error) {
      console.error(`💥 プロンプト処理エラー "${prompt}":`, error);
      return false;
    }
  }, [onImageGenerated]);

  // スケジューラーの実行
  const executeSchedulerBatch = useCallback(async () => {
    if (!schedulerFile) {
      console.log("❌ スケジューラー: ファイルが選択されていません");
      return;
    }

    console.log("🔄 スケジューラー: バッチ実行開始");
    setSchedulerStatus("running");
    
    try {
      const text = await schedulerFile.text();
      const prompts = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      console.log(`📄 ファイルから ${prompts.length} 個のプロンプトを読み込みました`);

      if (prompts.length === 0) {
        console.log("❌ スケジューラー: 有効なプロンプトが見つかりませんでした");
        return;
      }

      setSchedulerProgress({ current: 0, total: prompts.length });

      for (let i = 0; i < prompts.length; i++) {
        if (!isSchedulerRunning) {
          console.log("⏹️ スケジューラー: 停止が要求されました");
          break;
        }
        
        const currentPrompt = prompts[i];
        console.log(`\n📋 [${i + 1}/${prompts.length}] 処理中: "${currentPrompt}"`);
        setCurrentSchedulerPrompt(currentPrompt);
        setSchedulerProgress({ current: i + 1, total: prompts.length });

        const success = await processSchedulerPrompt(currentPrompt);
        console.log(`${success ? "✅" : "❌"} プロンプト ${i + 1} 処理${success ? "成功" : "失敗"}`);

        // 次の生成まで少し待機
        if (i < prompts.length - 1 && isSchedulerRunning) {
          console.log("⏳ 2秒待機中...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      console.log(`🎉 スケジューラー: ${prompts.length}個の画像生成バッチが完了しました`);
    } catch (error) {
      console.error("💥 スケジューラー: バッチ実行エラー:", error);
    } finally {
      console.log("🏁 スケジューラー: バッチ実行終了 - 待機状態に移行");
      setSchedulerStatus("waiting");
      setCurrentSchedulerPrompt("");
      setSchedulerProgress({ current: 0, total: 0 });
    }
  }, [schedulerFile, isSchedulerRunning, processSchedulerPrompt]);

  // スケジューラーの開始
  const startScheduler = useCallback(() => {
    if (!schedulerFile) {
      alert("テキストファイルを選択してください");
      return;
    }

    console.log(`🟢 スケジューラー開始: ${schedulerInterval}分間隔で実行します`);
    console.log(`📁 使用ファイル: ${schedulerFile.name}`);

    setIsSchedulerRunning(true);
    setSchedulerStatus("waiting");
    
    const now = new Date();
    const nextTime = new Date(now.getTime() + schedulerInterval * 60 * 1000);
    setNextExecutionTime(nextTime);

    console.log(`⏰ 次回実行予定: ${nextTime.toLocaleString('ja-JP')}`);

    // 最初の実行
    console.log("🚀 初回バッチ実行を開始します...");
    executeSchedulerBatch();

    // 定期実行を設定
    console.log(`⏱️ ${schedulerInterval}分間隔の定期実行タイマーを設定しました`);
    intervalRef.current = setInterval(() => {
      const nextTime = new Date(Date.now() + schedulerInterval * 60 * 1000);
      setNextExecutionTime(nextTime);
      console.log(`🔄 定期実行トリガー: 次回予定 ${nextTime.toLocaleString('ja-JP')}`);
      executeSchedulerBatch();
    }, schedulerInterval * 60 * 1000);

  }, [schedulerFile, schedulerInterval, executeSchedulerBatch]);

  // スケジューラーの停止
  const stopScheduler = useCallback(() => {
    console.log("🔴 スケジューラー停止が要求されました");
    
    setIsSchedulerRunning(false);
    setSchedulerStatus("idle");
    setNextExecutionTime(null);
    setCurrentSchedulerPrompt("");
    setSchedulerProgress({ current: 0, total: 0 });
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("⏱️ 定期実行タイマーをクリアしました");
    }
    
    console.log("✅ スケジューラーが正常に停止されました");
  }, []);

  // コンポーネントのアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Geminiで画像生成
        </h3>
      </div>

      {/* タブナビゲーション */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab("single")}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "single"
              ? "bg-white text-purple-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Send className="h-4 w-4 mr-2" />
          単体生成
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "bulk"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FileText className="h-4 w-4 mr-2" />
          複数を生成保存
        </button>
        <button
          onClick={() => setActiveTab("scheduler")}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "scheduler"
              ? "bg-white text-green-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Clock className="h-4 w-4 mr-2" />
          定期実行
        </button>
      </div>

      <div className="space-y-4">
        {/* 単体生成タブ */}
        {activeTab === "single" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロンプト
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="画像生成のプロンプトを入力してください..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isGenerating || isBulkGenerating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter: 送信 | Shift+Enter: 改行
              </p>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                文字数: {prompt.length}
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || isBulkGenerating || !prompt.trim()}
                className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    画像を生成
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* 一括生成タブ */}
        {activeTab === "bulk" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロンプトテキストファイル
              </label>
              <div className="flex items-center space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileSelect}
                  disabled={isGenerating || isBulkGenerating}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                <button
                  onClick={handleBulkGenerate}
                  disabled={!selectedFile || isGenerating || isBulkGenerating}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBulkGenerating ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      実行中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      実行
                    </>
                  )}
                </button>
              </div>
              {selectedFile && (
                <p className="text-xs text-gray-600 mt-1">
                  選択済み: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">
                使用方法
              </h5>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• テキストファイル（.txt）を準備してください</li>
                <li>• 1行に1つのプロンプトを記載してください</li>
                <li>• 空行は自動的にスキップされます</li>
                <li>• 各画像は自動でR2ギャラリーに保存されます</li>
              </ul>
            </div>
          </div>
        )}

        {/* スケジューラータブ */}
        {activeTab === "scheduler" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロンプトテキストファイル
                </label>
                <input
                  ref={schedulerFileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleSchedulerFileSelect}
                  disabled={isSchedulerRunning}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
                />
                {schedulerFile && (
                  <p className="text-xs text-gray-600 mt-1">
                    選択済み: {schedulerFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  実行間隔（分）
                </label>
                <input
                  type="number"
                  value={schedulerInterval}
                  onChange={(e) => setSchedulerInterval(Math.max(1, parseInt(e.target.value) || 10))}
                  disabled={isSchedulerRunning}
                  min="1"
                  max="1440"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1〜1440分（24時間）まで設定可能
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={startScheduler}
                disabled={!schedulerFile || isSchedulerRunning}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4 mr-2" />
                開始
              </button>
              <button
                onClick={stopScheduler}
                disabled={!isSchedulerRunning}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pause className="h-4 w-4 mr-2" />
                停止
              </button>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    schedulerStatus === "idle"
                      ? "bg-gray-400"
                      : schedulerStatus === "running"
                      ? "bg-orange-500"
                      : "bg-green-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-600">
                  {schedulerStatus === "idle"
                    ? "停止中"
                    : schedulerStatus === "running"
                    ? "実行中"
                    : "待機中"}
                </span>
              </div>
            </div>

            {nextExecutionTime && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      次回実行予定時刻
                    </p>
                    <p className="text-xs text-green-700">
                      {nextExecutionTime.toLocaleString('ja-JP')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-green-900 mb-2">
                スケジューラーの使用方法
              </h5>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• テキストファイル（.txt）に1行1プロンプトで記載してください</li>
                <li>• 実行間隔を設定して「開始」をクリックしてください</li>
                <li>• 指定した間隔でファイル内の全プロンプトが順次実行されます</li>
                <li>• 生成された画像は自動でR2に保存されます</li>
                <li>• 「停止」をクリックするまで定期実行が継続されます</li>
              </ul>
            </div>
          </div>
        )}

        {isGenerating && !isBulkGenerating && schedulerStatus === "idle" && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <Loader className="h-5 w-5 text-purple-600 animate-spin mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-900">
                  Geminiで画像を生成中...
                </p>
                <p className="text-xs text-purple-700">
                  プロンプト: "{prompt}"
                </p>
              </div>
            </div>
          </div>
        )}

        {isBulkGenerating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Loader className="h-5 w-5 text-blue-600 animate-spin mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  一括画像生成中... ({bulkProgress.current}/{bulkProgress.total}
                  )
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  現在のプロンプト: "{currentBulkPrompt}"
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        bulkProgress.total > 0
                          ? (bulkProgress.current / bulkProgress.total) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* スケジューラーの実行状況表示 */}
        {schedulerStatus === "running" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Loader className="h-5 w-5 text-green-600 animate-spin mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  スケジューラー実行中... ({schedulerProgress.current}/{schedulerProgress.total})
                </p>
                <p className="text-xs text-green-700 mt-1">
                  現在のプロンプト: "{currentSchedulerPrompt}"
                </p>
                <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        schedulerProgress.total > 0
                          ? (schedulerProgress.current / schedulerProgress.total) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {schedulerStatus === "waiting" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  次回実行を待機中
                </p>
                <p className="text-xs text-blue-700">
                  {schedulerInterval}分間隔で自動実行されています
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default GeminiImageGenerator;
