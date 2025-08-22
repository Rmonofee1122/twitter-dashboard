"use client";

import { memo } from "react";
import { Image as ImageIcon } from "lucide-react";

interface ImageStatsSummaryProps {
  total: number;
}

const ImageStatsSummary = memo(function ImageStatsSummary({
  total,
}: ImageStatsSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center">
        <div className="bg-blue-50 p-2 rounded-lg">
          <ImageIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">総画像数</p>
          <p className="text-2xl font-semibold text-gray-900">
            {total.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
});

export default ImageStatsSummary;