"use client";

import { memo } from "react";

const DomainPageHeader = memo(function DomainPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600">{description}</p>
    </div>
  );
});

export default DomainPageHeader;
