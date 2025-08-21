"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Globe, X, Search, ChevronDown } from "lucide-react";

interface DomainFilterProps {
  availableDomains: string[];
  selectedDomains: string[];
  onDomainChange: (domains: string[]) => void;
  onClear: () => void;
}

const DomainFilter = memo(function DomainFilter({
  availableDomains,
  selectedDomains,
  onDomainChange,
  onClear,
}: DomainFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredDomains = useMemo(() => {
    return availableDomains.filter(domain =>
      domain.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableDomains, searchTerm]);

  const handleDomainToggle = useCallback((domain: string) => {
    const newDomains = selectedDomains.includes(domain)
      ? selectedDomains.filter(d => d !== domain)
      : [...selectedDomains, domain];
    onDomainChange(newDomains);
  }, [selectedDomains, onDomainChange]);

  const handleSelectAll = useCallback(() => {
    onDomainChange(filteredDomains);
  }, [onDomainChange, filteredDomains]);

  const handleDeselectAll = useCallback(() => {
    onDomainChange([]);
  }, [onDomainChange]);

  const handleSelectTop = useCallback((count: number) => {
    onDomainChange(availableDomains.slice(0, count));
  }, [onDomainChange, availableDomains]);

  const hasFilter = useMemo(() => 
    selectedDomains.length > 0 && selectedDomains.length < availableDomains.length,
    [selectedDomains.length, availableDomains.length]
  );

  const isAllSelected = useMemo(() => 
    selectedDomains.length === availableDomains.length,
    [selectedDomains.length, availableDomains.length]
  );

  const displayedDomains = isExpanded ? filteredDomains : filteredDomains.slice(0, 10);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            ドメインフィルター
          </h3>
          {hasFilter && (
            <button
              onClick={onClear}
              className="flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              <X className="h-3 w-3 mr-1" />
              クリア
            </button>
          )}
        </div>
        <div className="flex space-x-2 text-sm">
          <button
            onClick={handleSelectAll}
            disabled={isAllSelected}
            className="px-3 py-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            すべて選択
          </button>
          <button
            onClick={handleDeselectAll}
            disabled={selectedDomains.length === 0}
            className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            すべて解除
          </button>
        </div>
      </div>

      {/* クイック選択 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => handleSelectTop(5)}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          上位5件
        </button>
        <button
          onClick={() => handleSelectTop(10)}
          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
        >
          上位10件
        </button>
        <button
          onClick={() => handleSelectTop(20)}
          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
        >
          上位20件
        </button>
      </div>

      {/* 検索 */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="ドメインを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* ドメインリスト */}
      <div className="max-h-60 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {displayedDomains.map((domain) => {
            const isSelected = selectedDomains.includes(domain);
            return (
              <label
                key={domain}
                className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleDomainToggle(domain)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-mono text-gray-700 truncate">
                  {domain}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 展開/折りたたみボタン */}
      {filteredDomains.length > 10 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center mx-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ChevronDown 
              className={`h-4 w-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
            {isExpanded 
              ? `折りたたむ` 
              : `さらに表示 (${filteredDomains.length - 10}件)`
            }
          </button>
        </div>
      )}

      {/* 選択中のドメイン表示 */}
      {hasFilter && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            <span className="font-medium">選択中: {selectedDomains.length}件</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedDomains.slice(0, 5).map(domain => (
              <span
                key={domain}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
              >
                {domain}
                <button
                  onClick={() => handleDomainToggle(domain)}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {selectedDomains.length > 5 && (
              <span className="text-xs text-blue-600">
                +{selectedDomains.length - 5}件
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default DomainFilter;