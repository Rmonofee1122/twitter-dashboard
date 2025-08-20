import type { DomainData } from "@/lib/stats-api";

interface DomainRankingListProps {
  domainData: DomainData[];
}

export default function DomainRankingList({
  domainData,
}: DomainRankingListProps) {
  const maxCount = Math.max(...domainData.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        ドメイン別作成数
      </h3>
      <div className="space-y-4">
        {domainData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <span className="text-lg font-bold text-gray-900 mr-4">
                #{index + 1}
              </span>
              <span className="text-gray-700 font-mono">{item.domain}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                  }}
                ></div>
              </div>
              <span className="font-semibold text-gray-900 w-16 text-right">
                {item.count.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {domainData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            ドメインデータがありません
          </div>
        )}
      </div>
    </div>
  );
}
