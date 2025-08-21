import type { IpData } from "@/app/api/stats/route";

interface IpRankingListProps {
  ipDistribution: IpData[];
}

export default function IpRankingList({ ipDistribution }: IpRankingListProps) {
  const maxCount = Math.max(...ipDistribution.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        IP別アカウント作成数 (上位5位)
      </h3>
      <div className="space-y-4">
        {ipDistribution.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <span className="text-lg font-bold text-gray-900 mr-4">
                #{index + 1}
              </span>
              <span className="text-gray-700 font-mono">{item.ip}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
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
        {ipDistribution.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            IPデータがありません
          </div>
        )}
      </div>
    </div>
  );
}
