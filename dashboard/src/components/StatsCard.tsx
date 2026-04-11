'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}

export default function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[#666]">{title}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-[#666] mt-2">{subtitle}</p>
      )}
    </div>
  );
}
