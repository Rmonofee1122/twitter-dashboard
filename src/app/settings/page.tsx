"use client";

import { useState } from "react";
import SettingsHeader from "@/components/settings/settings-header";
import SettingsNavigation from "@/components/settings/settings-navigation";
import DatabaseSettings from "@/components/settings/database-settings";
import NotificationSettings from "@/components/settings/notification-settings";
import SecuritySettings from "@/components/settings/security-settings";
import DisplaySettings from "@/components/settings/display-settings";

interface Settings {
  database: {
    supabaseUrl: string;
    supabaseKey: string;
    autoBackup: boolean;
    backupFrequency: "daily" | "weekly" | "monthly";
  };
  notifications: {
    emailAlerts: boolean;
    emailAddress: string;
    alertThreshold: number;
    dailyReports: boolean;
  };
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    ipWhitelist: string[];
    auditLog: boolean;
  };
  display: {
    language: "ja" | "en";
    timezone: string;
    dateFormat: "japanese" | "iso" | "us";
    itemsPerPage: number;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    database: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      autoBackup: true,
      backupFrequency: "daily",
    },
    notifications: {
      emailAlerts: true,
      emailAddress: "admin@example.com",
      alertThreshold: 100,
      dailyReports: true,
    },
    security: {
      enableTwoFactor: false,
      sessionTimeout: 60,
      ipWhitelist: ["192.168.1.0/24"],
      auditLog: true,
    },
    display: {
      language: "ja",
      timezone: "Asia/Tokyo",
      dateFormat: "japanese",
      itemsPerPage: 20,
    },
  });

  const [activeTab, setActiveTab] = useState<
    "database" | "notifications" | "security" | "display"
  >("database");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const handleSave = async () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1000);
  };

  const handleTestConnection = async () => {
    alert("接続テストを実行します");
  };

  const handleClearCache = () => {
    alert("キャッシュをクリアしました");
  };

  return (
    <div className="space-y-6">
      <SettingsHeader
        onSave={handleSave}
        saveStatus={saveStatus}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <SettingsNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
          {activeTab === "database" && (
            <DatabaseSettings
              config={settings.database}
              onChange={(config) => setSettings({
                ...settings,
                database: config
              })}
              onTestConnection={handleTestConnection}
              onClearCache={handleClearCache}
            />
          )}

          {activeTab === "notifications" && (
            <NotificationSettings
              config={settings.notifications}
              onChange={(config) => setSettings({
                ...settings,
                notifications: config
              })}
            />
          )}

          {activeTab === "security" && (
            <SecuritySettings
              config={settings.security}
              onChange={(config) => setSettings({
                ...settings,
                security: config
              })}
            />
          )}

          {activeTab === "display" && (
            <DisplaySettings
              config={settings.display}
              onChange={(config) => setSettings({
                ...settings,
                display: config
              })}
            />
          )}
        </div>
      </div>
    </div>
  );
}