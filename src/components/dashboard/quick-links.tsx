import { LucideIcon } from 'lucide-react';

interface QuickLink {
  href: string;
  icon: LucideIcon;
  label: string;
  hoverColor: string;
}

interface QuickLinksProps {
  links: QuickLink[];
}

export default function QuickLinks({ links }: QuickLinksProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        クイックアクション
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className={`flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg ${link.hoverColor} transition-colors`}
          >
            <link.icon className="h-5 w-5 text-gray-500 mr-2" />
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}