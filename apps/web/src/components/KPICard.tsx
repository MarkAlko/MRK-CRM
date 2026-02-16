'use client';

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string; // ✅ הוספה
}

export default function KPICard({ label, value, subtitle, color }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || 'text-gray-900'}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
