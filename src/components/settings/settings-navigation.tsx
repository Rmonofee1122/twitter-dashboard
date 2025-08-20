import { Database, Bell, Shield, Globe, LucideIcon } from 'lucide-react';

type SettingsTab = 'database' | 'notifications' | 'security' | 'display';

interface Tab {
  id: SettingsTab;
  name: string;
  icon: LucideIcon;
}

interface SettingsNavigationProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const tabs: Tab[] = [
  { id: 'database', name: 'データベース', icon: Database },
  { id: 'notifications', name: '通知設定', icon: Bell },
  { id: 'security', name: 'セキュリティ', icon: Shield },
  { id: 'display', name: '表示設定', icon: Globe },
];

export default function SettingsNavigation({ activeTab, onTabChange }: SettingsNavigationProps) {
  return (
    <nav className="space-y-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
            activeTab === tab.id
              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <tab.icon className="h-5 w-5 mr-3" />
          {tab.name}
        </button>
      ))}
    </nav>
  );
}