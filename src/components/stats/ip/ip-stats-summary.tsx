import type { IpData } from "@/app/api/stats/route";

interface IpStatsSummaryProps {
  ipData: IpData[];
}

export default function IpStatsSummary({ ipData }: IpStatsSummaryProps) {
  if (ipData.length === 0) return null;

  const totalAccounts = ipData.reduce((sum, item) => sum + item.count, 0);
  const uniqueIpCount = ipData.length;
  const topIp = ipData[0]?.ip || "-";

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{uniqueIpCount}</div>
        <div className="text-gray-600">ユニークIP数</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {totalAccounts.toLocaleString()}
        </div>
        <div className="text-gray-600">総アカウント数</div>
      </div>
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-2xl font-bold text-purple-600 font-mono">
          {topIp}
        </div>
        <div className="text-gray-600">最多IP</div>
      </div>
    </div>
  );
}
