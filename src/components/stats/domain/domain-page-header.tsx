"use client";

import { memo } from "react";

const DomainPageHeader = memo(function DomainPageHeader() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">ドメイン別統計</h1>
      <p className="text-gray-600">
        メールドメインごとのアカウント作成数の詳細統計
      </p>
    </div>
  );
});

export default DomainPageHeader;