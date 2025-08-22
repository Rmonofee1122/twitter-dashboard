import React, { useState } from "react";
import { X } from "lucide-react";
import { TwitterCreateLog } from "@/types/database";

interface AccountEditModalProps {
  account: TwitterCreateLog | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, status: string) => Promise<void>;
}

const AccountEditModal: React.FC<AccountEditModalProps> = ({
  account,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (account) {
      setSelectedStatus(account.app_login || "pending");
    }
  }, [account]);

  const handleSave = async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      await onSave(account.id, selectedStatus);
      onClose();
    } catch (error) {
      console.error("ステータス更新に失敗しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            アカウント編集
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Twitter ID
            </label>
            <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
              {account.twitter_id}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
              {account.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">アクティブ</option>
              <option value="farmup">保留中</option>
              <option value="suspend">BAN</option>
              <option value="false">除外</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            disabled={isLoading}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {isLoading ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountEditModal;
