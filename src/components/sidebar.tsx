"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  Users,
  TrendingUp,
  Settings,
  Menu,
  X,
  Twitter,
  ChevronDown,
  ChevronRight,
  Globe,
  MapPin,
  UserCheck,
  UserX,
  UserMinus,
  Clock,
  Activity,
  BarChart,
  Clock8,
  Image,
  FileText,
  EyeOff,
  AlertTriangleIcon,
  CheckCircle,
  CircleX,
  Clock3,
} from "lucide-react";

const navigation = [
  { name: "ホーム", href: "/", icon: Home },
  {
    name: "統計情報",
    href: "/stats",
    icon: BarChart3,
    submenu: [
      { name: "概要", href: "/stats", icon: BarChart3 },
      { name: "ドメイン別統計", href: "/stats/domain", icon: Globe },
      { name: "IP別統計", href: "/stats/ip", icon: MapPin },
      { name: "ステータス別", href: "/stats/status", icon: Activity },
    ],
  },
  {
    name: "アカウント一覧",
    href: "/accounts",
    icon: Users,
    submenu: [
      { name: "全ステータス", href: "/accounts", icon: Users },
      {
        name: "アクティブ",
        href: "/accounts/active",
        icon: CheckCircle,
      },
      {
        name: "シャドBAN",
        href: "/accounts/shadowban",
        icon: AlertTriangleIcon,
      },
      { name: "審査中", href: "/accounts/pending", icon: Clock },
      { name: "一時制限", href: "/accounts/temp-locked", icon: Clock3 },
      { name: "凍結", href: "/accounts/banned", icon: CircleX },
      { name: "未発見", href: "/accounts/notfound", icon: EyeOff },
    ],
  },
  {
    name: "作成推移",
    href: "/trends",
    icon: TrendingUp,
    submenu: [
      { name: "作成推移", href: "/trends", icon: TrendingUp },
      {
        name: "累計アカウント数推移",
        href: "/trends/cumulative",
        icon: BarChart,
      },
      { name: "時間別作成数分布", href: "/trends/hourly", icon: Clock8 },
    ],
  },
  // { name: '画像一覧', href: '/images', icon: Image },
  { name: "画像一覧（R2）", href: "/images-r2", icon: Image },
  // { name: "アカウント一覧v2", href: "/accounts-v2", icon: Users },
  { name: "シャドBAN履歴", href: "/shadowban-log", icon: FileText },
  { name: "設定", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName]
    );
  };

  return (
    <>
      {/* モバイル用メニューボタン */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 text-white p-2 rounded-md"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* オーバーレイ (モバイル用) */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* サイドバー */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Twitter className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-gray-900">
                Twitter Dashboard
              </span>
            </div>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const isExpanded = expandedMenus.includes(item.name);
                const hasSubmenu = item.submenu && item.submenu.length > 0;

                return (
                  <li key={item.name}>
                    {hasSubmenu ? (
                      <div>
                        <button
                          onClick={() => toggleSubmenu(item.name)}
                          className={`
                            w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium
                            transition-colors duration-200
                            ${
                              isActive ||
                              item.submenu?.some((sub) => pathname === sub.href)
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            }
                          `}
                        >
                          <div className="flex items-center">
                            <item.icon
                              className={`mr-3 h-5 w-5 ${
                                isActive ||
                                item.submenu?.some(
                                  (sub) => pathname === sub.href
                                )
                                  ? "text-blue-700"
                                  : "text-gray-400"
                              }`}
                            />
                            {item.name}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>

                        {isExpanded && (
                          <ul className="mt-2 ml-6 space-y-1">
                            {item.submenu.map((subItem) => {
                              const isSubActive = pathname === subItem.href;
                              return (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`
                                      flex items-center px-4 py-2 rounded-lg text-sm
                                      transition-colors duration-200
                                      ${
                                        isSubActive
                                          ? "bg-blue-100 text-blue-700"
                                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                      }
                                    `}
                                  >
                                    <subItem.icon
                                      className={`mr-3 h-4 w-4 ${
                                        isSubActive
                                          ? "text-blue-700"
                                          : "text-gray-400"
                                      }`}
                                    />
                                    {subItem.name}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`
                          flex items-center px-4 py-3 rounded-lg text-sm font-medium
                          transition-colors duration-200
                          ${
                            isActive
                              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          }
                        `}
                      >
                        <item.icon
                          className={`mr-3 h-5 w-5 ${
                            isActive ? "text-blue-700" : "text-gray-400"
                          }`}
                        />
                        {item.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* フッター */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Twitter Account Manager v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
