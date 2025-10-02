import React, { useState, useCallback } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AddAccountFormProps {
  onAccountAdded?: () => void;
}

const AddAccountForm = React.memo(function AddAccountForm({
  onAccountAdded,
}: AddAccountFormProps) {
  const [screenName, setScreenName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!screenName.trim()) {
        toast.error("スクリーン名を入力してください");
        return;
      }

      // @マークを除去
      const cleanScreenName = screenName.trim().replace(/^@/, "");

      setIsAdding(true);
      try {
        const response = await fetch("/api/other-accounts/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ screen_name: cleanScreenName }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "アカウントの追加に失敗しました");
        }

        toast.success(result.message || "アカウントを追加しました");
        setScreenName("");
        onAccountAdded?.();
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
    [screenName, onAccountAdded]
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        他社アカウント追加
      </h2>
      <form onSubmit={handleSubmit} className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="スクリーン名を入力（例: @username または username）"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              disabled={isAdding}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isAdding || !screenName.trim()}
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
    </div>
  );
});

export default AddAccountForm;
