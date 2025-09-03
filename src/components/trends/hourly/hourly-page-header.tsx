"use client";

import { memo } from "react";
import { Clock8 } from "lucide-react";

const HourlyPageHeader = memo(function HourlyPageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Clock8 className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">時間別作成数分布</h1>
      </div>
    </div>
  );
});

export default HourlyPageHeader;