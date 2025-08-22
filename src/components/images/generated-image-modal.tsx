"use client";

import { memo, useCallback } from "react";
import { Download, Save, X } from "lucide-react";

interface GeneratedImageModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  prompt: string;
  onClose: () => void;
  onSave?: (imageUrl: string, prompt: string) => void;
}

const GeneratedImageModal = memo(function GeneratedImageModal({
  isOpen,
  imageUrl,
  prompt,
  onClose,
  onSave,
}: GeneratedImageModalProps) {
  const handleDownload = useCallback(() => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl]);

  const handleSave = useCallback(() => {
    if (!imageUrl) return;
    onSave?.(imageUrl, prompt);
  }, [imageUrl, prompt, onSave]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">生成された画像</h2>
            <p className="text-sm text-gray-600 mt-1">
              プロンプト: "{prompt}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="モーダルを閉じる"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 画像表示 */}
            <div className="flex-1">
              <div className="bg-gray-100 rounded-lg p-4">
                <img
                  src={imageUrl}
                  alt={`Generated: ${prompt}`}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* 操作パネル */}
            <div className="lg:w-80 space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">生成情報</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-purple-700 font-medium">プロンプト:</span>
                    <p className="text-purple-800 mt-1">{prompt}</p>
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">形式:</span>
                    <span className="text-purple-800 ml-2">PNG (Base64)</span>
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">生成時刻:</span>
                    <span className="text-purple-800 ml-2">
                      {new Date().toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </button>

                {onSave && (
                  <button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    ギャラリーに保存
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default GeneratedImageModal;