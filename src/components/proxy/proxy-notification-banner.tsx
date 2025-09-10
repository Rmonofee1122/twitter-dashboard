"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ProxyNotificationBannerProps {
  message: string | null;
  type: "success" | "error" | null;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function ProxyNotificationBanner({
  message,
  type,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000,
}: ProxyNotificationBannerProps) {
  useEffect(() => {
    if (message && type && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [message, type, autoClose, autoCloseDelay, onClose]);

  if (!message || !type) return null;

  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const borderColor = isSuccess ? "border-green-200" : "border-red-200";
  const textColor = isSuccess ? "text-green-800" : "text-red-800";
  const iconColor = isSuccess ? "text-green-600" : "text-red-600";
  const buttonColor = isSuccess ? "text-green-600 hover:bg-green-100" : "text-red-600 hover:bg-red-100";

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-4 shadow-sm`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isSuccess ? (
            <CheckCircle className={`h-5 w-5 ${iconColor}`} />
          ) : (
            <XCircle className={`h-5 w-5 ${iconColor}`} />
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${textColor}`}>
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={onClose}
            className={`inline-flex rounded-md p-1.5 ${buttonColor} transition-colors`}
            aria-label="通知を閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}