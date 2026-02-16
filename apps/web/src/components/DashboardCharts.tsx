'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface ChartData {
  name: string;
  value: number;
}

export function LeadsByProjectChart({ data }: { data: ChartData[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">לידים לפי סוג פרויקט</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [value, 'לידים']} />
            <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function LeadsBySourceChart({ data }: { data: ChartData[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">לידים לפי מקור</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value, 'לידים']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
