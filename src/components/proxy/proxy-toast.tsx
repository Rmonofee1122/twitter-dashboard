"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";

interface ProxyToastProps {
  message: string | null;
  type: "success" | "error" | null;
  onClose: () => void;
}

export default function ProxyToast({
  message,
  type,
  onClose,
}: ProxyToastProps) {
  useEffect(() => {
    if (message && type) {
      if (type === "success") {
        toast.success(message, {
          duration: 3000,
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          style: {
            background: '#fff',
            color: '#1f2937',
            border: '1px solid #d1fae5',
            borderLeft: '4px solid #10b981',
          },
        });
      } else {
        toast.error(message, {
          duration: 3000,
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          style: {
            background: '#fff',
            color: '#1f2937',
            border: '1px solid #fee2e2',
            borderLeft: '4px solid #ef4444',
          },
        });
      }
      
      // トーストを表示したら状態をクリア
      onClose();
    }
  }, [message, type, onClose]);

  return null; // react-hot-toastが描画を担当するため、このコンポーネントは何も描画しない
}