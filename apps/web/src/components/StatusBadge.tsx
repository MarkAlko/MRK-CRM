'use client';

import { getStatusLabel, getStatusColor } from '@/lib/constants';

export default function StatusBadge({ status }: { status: string }) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
