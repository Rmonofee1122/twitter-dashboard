import React, { useState, useCallback } from "react";
import { UserPlus, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface AddAccountFormProps {
  onAccountAdded?: () => void;
}

interface AddResults {
  success: string[];
  failed: { screen_name: string; error: string }[];
  duplicate: string[];
  total: number;
}

const AddAccountForm = React.memo(function AddAccountForm({
  onAccountAdded,
}: AddAccountFormProps) {
  const [screenNames, setScreenNames] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addResults, setAddResults] = useState<AddResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!screenNames.trim()) {
        toast.error("スクリーン名を入力してください");
        return;
      }

      // カンマ、スペース、改行で分割して@マークを除去
      const screenNameList = screenNames
        .split(/[,\s\n]+/)
        .map((name) => name.trim().replace(/^@/, ""))
        .filter((name) => name.length > 0);

      if (screenNameList.length === 0) {
        toast.error("有効なスクリーン名を入力してください");
        return;
      }

      // 重複を除去
      const uniqueScreenNames = Array.from(new Set(screenNameList));

      setIsAdding(true);
      setShowResults(false);
      setAddResults(null);

      try {
        const response = await fetch("/api/other-accounts/add-bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ screen_names: uniqueScreenNames }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "アカウントの追加に失敗しました");
        }

        setAddResults(result.results);
        setShowResults(true);

        // 結果をトーストで表示
        if (result.results.success.length > 0) {
          toast.success(
            `${result.results.success.length}件のアカウントを追加しました`
          );
        }
        if (result.results.duplicate.length > 0) {
          toast.error(
            `${result.results.duplicate.length}件は既に登録されています`
          );
        }
        if (result.results.failed.length > 0) {
          toast.error(`${result.results.failed.length}件の追加に失敗しました`);
        }

        // 成功したアカウントがある場合のみテキストエリアをクリア
        if (result.results.success.length > 0) {
          setScreenNames("");
          onAccountAdded?.();
        }
      } catch (error) {
        console.error("アカウント追加エラー:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "アカウントの追加に失敗しました"
        );
      } finally {
        setIsAdding(false);
      }
    },
    [screenNames, onAccountAdded]
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        他社アカウント追加（複数対応）
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-gray-600">
            スクリーン名を入力（カンマ、スペース、改行区切りで複数入力可能）
          </label>
          <textarea
            placeholder="例: @username1, @username2, @username3 または改行で区切って入力"
            value={screenNames}
            onChange={(e) => setScreenNames(e.target.value)}
            disabled={isAdding}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-y"
          />
        </div>
        <button
          type="submit"
          disabled={isAdding || !screenNames.trim()}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isAdding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              追加中...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              アカウント追加
            </>
          )}
        </button>
      </form>

      {/* 結果表示 */}
      {showResults && addResults && (
        <div className="mt-4 space-y-3">
          {/* 成功 */}
          {addResults.success.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <h3 className="text-sm font-semibold text-green-800">
                  追加成功 ({addResults.success.length}件)
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {addResults.success.map((name) => (
                  <span
                    key={name}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                  >
                    @{name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 重複 */}
          {addResults.duplicate.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <h3 className="text-sm font-semibold text-yellow-800">
                  既に登録済み ({addResults.duplicate.length}件)
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {addResults.duplicate.map((name) => (
                  <span
                    key={name}
                    className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs"
                  >
                    @{name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 失敗 */}
          {addResults.failed.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                <h3 className="text-sm font-semibold text-red-800">
                  追加失敗 ({addResults.failed.length}件)
                </h3>
              </div>
              <div className="space-y-1">
                {addResults.failed.map((item) => (
                  <div
                    key={item.screen_name}
                    className="flex items-start space-x-2 text-xs"
                  >
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                      @{item.screen_name}
                    </span>
                    <span className="text-red-700 pt-1">{item.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default AddAccountForm;
