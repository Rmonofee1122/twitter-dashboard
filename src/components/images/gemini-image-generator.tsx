"use client";

import { memo, useState, useCallback } from "react";
import { Sparkles, Send, Loader } from "lucide-react";

interface GeminiImageGeneratorProps {
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
}

const GeminiImageGenerator = memo(function GeminiImageGenerator({
  onImageGenerated,
}: GeminiImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Geminiで画像生成
        </h3>
      </div>

      <div className="space-y-4">
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
            disabled={isGenerating}
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
            disabled={isGenerating || !prompt.trim()}
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

        {isGenerating && (
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
      </div>
    </div>
  );
});

export default GeminiImageGenerator;