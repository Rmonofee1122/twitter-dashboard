"use client";

import { memo, useState, useCallback, useRef } from "react";
import { Sparkles, Send, Loader, Upload, FileText } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      alert("プロンプトを入力してください");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error("画像生成に失敗しました");
      }

      const result = await response.json();
      
      if (result.success && result.imageUrl) {
        onImageGenerated?.(result.imageUrl, prompt);
      } else {
        throw new Error("画像URLの取得に失敗しました");
      }
    } catch (error) {
      console.error("画像生成エラー:", error);
      alert("画像生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, onImageGenerated]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }, [handleGenerate]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/plain") {
      setSelectedFile(file);
    } else {
      alert("テキストファイル(.txt)を選択してください");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, []);

  const handleBulkGenerate = useCallback(async () => {
    if (!selectedFile) {
      alert("テキストファイルを選択してください");
      return;
    }

    setIsBulkGenerating(true);
    try {
      const text = await selectedFile.text();
      const prompts = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
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
              onImageGenerated?.(result.imageUrl, currentPrompt);
            } else {
              console.error(`プロンプト "${currentPrompt}" の生成に失敗しました: レスポンス内容が不正`);
            }
          } else {
            console.error(`プロンプト "${currentPrompt}" の生成に失敗しました: HTTP ${response.status}`);
          }
        } catch (error) {
          console.error(`プロンプト "${currentPrompt}" の生成エラー:`, error);
        }

        // 次の生成まで少し待機（API制限対策）
        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
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
          onClick={() => setActiveTab('single')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'single'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Send className="h-4 w-4 mr-2" />
          単体生成
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'bulk'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4 mr-2" />
          複数を生成保存
        </button>
      </div>

      <div className="space-y-4">
        {/* 単体生成タブ */}
        {activeTab === 'single' && (
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
        {activeTab === 'bulk' && (
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
              <h5 className="text-sm font-medium text-blue-900 mb-2">使用方法</h5>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• テキストファイル（.txt）を準備してください</li>
                <li>• 1行に1つのプロンプトを記載してください</li>
                <li>• 空行は自動的にスキップされます</li>
                <li>• 各画像は自動でR2ギャラリーに保存されます</li>
              </ul>
            </div>
          </div>
        )}

        {isGenerating && !isBulkGenerating && (
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
                  一括画像生成中... ({bulkProgress.current}/{bulkProgress.total})
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  現在のプロンプト: "{currentBulkPrompt}"
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default GeminiImageGenerator;