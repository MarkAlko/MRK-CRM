'use client';

import type { Lead } from '@/lib/types';
import { formatPhoneDisplay } from '@/lib/phone';
import { getTemperatureLabel, getTemperatureColor } from '@/lib/constants';
import StatusBadge from './StatusBadge';

interface LeadCardProps {
  lead: Lead;
  onClick?: (lead: Lead) => void;
}

/**
 * Returns a Hebrew relative time string, e.g. "לפני 3 דקות"
 */
function timeAgoHebrew(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (minutes < 1) return 'הרגע';
  if (minutes < 60) return `לפני ${minutes} דקות`;
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days === 1) return 'לפני יום';
  if (days < 30) return `לפני ${days} ימים`;

  const months = Math.floor(days / 30);
  if (months === 1) return 'לפני חודש';
  if (months < 12) return `לפני ${months} חודשים`;

  const years = Math.floor(days / 365);
  if (years === 1) return 'לפני שנה';
  return `לפני ${years} שנים`;
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
  return (
    <div
      onClick={() => onClick?.(lead)}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header: name + temperature */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-gray-900 truncate">
          {lead.full_name}
        </h4>
        {lead.temperature && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 ${getTemperatureColor(lead.temperature)}`}
          >
            {getTemperatureLabel(lead.temperature)}
          </span>
        )}
      </div>

      {/* Phone */}
      <p className="text-xs text-gray-500 mb-2 font-mono" dir="ltr">
        {formatPhoneDisplay(lead.phone)}
      </p>

      {/* Footer: status badge + time */}
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={lead.status} />
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {timeAgoHebrew(lead.created_at)}
        </span>
      </div>
    </div>
  );
}
