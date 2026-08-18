import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Users,
  PackageCheck,
  Boxes,
  Clock
} from 'lucide-react';

interface Props {
  analyticsData: any;
}

export const AnalyticsView: React.FC<Props> = ({ analyticsData }) => {
  const dailyVolume = analyticsData?.dailyVolume || [
    { day: 'Mon', total: 84, onTime: 81, delayed: 3, fulfillmentRate: 96.4 },
    { day: 'Tue', total: 96, onTime: 91, delayed: 5, fulfillmentRate: 94.7 },
    { day: 'Wed', total: 110, onTime: 104, delayed: 6, fulfillmentRate: 94.5 },
    { day: 'Thu', total: 102, onTime: 98, delayed: 4, fulfillmentRate: 96.0 },
    { day: 'Fri', total: 125, onTime: 118, delayed: 7, fulfillmentRate: 94.4 },
    { day: 'Sat', total: 78, onTime: 76, delayed: 2, fulfillmentRate: 97.4 },
    { day: 'Sun', total: 65, onTime: 63, delayed: 2, fulfillmentRate: 96.9 }
  ];

  const priorityCounts = analyticsData?.priorityCounts || {
    CRITICAL: 14,
    HIGH: 32,
    MEDIUM: 40,
    LOW: 18
  };

  const priorityPieData = [
    { name: 'Critical', value: priorityCounts.CRITICAL, color: '#e11d48' },
    { name: 'High', value: priorityCounts.HIGH, color: '#f59e0b' },
    { name: 'Medium', value: priorityCounts.MEDIUM, color: '#3b82f6' },
    { name: 'Low', value: priorityCounts.LOW, color: '#94a3b8' }
  ];

  const categoryDistribution = analyticsData?.categoryDistribution || [
    { category: 'Electronics', healthy: 12, lowStock: 3, outOfStock: 1 },
    { category: 'Robotics', healthy: 8, lowStock: 2, outOfStock: 1 },
    { category: 'Hardware', healthy: 10, lowStock: 1, outOfStock: 0 },
    { category: 'Medical', healthy: 9, lowStock: 0, outOfStock: 0 },
    { category: 'Tools', healthy: 8, lowStock: 1, outOfStock: 0 }
  ];

  const stationUtilization = analyticsData?.stationUtilization || [
    { station: 'St-01', utilization: 72, avgTime: 4.2 },
    { station: 'St-02', utilization: 64, avgTime: 3.8 },
    { station: 'St-03', utilization: 98, avgTime: 6.8 },
    { station: 'St-04', utilization: 81, avgTime: 4.9 },
    { station: 'St-05', utilization: 55, avgTime: 3.5 },
    { station: 'St-06', utilization: 70, avgTime: 4.1 }
  ];

  return (
    <div id="view-operational-analytics" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Operational Analytics & Telemetry
            </span>
            <span className="text-xs text-slate-400">7-Day Rolling Window</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Warehouse Performance Analytics</h1>
          <p className="text-xs text-slate-500">
            Fulfillment velocity, SLA compliance rates, station load distribution, and category inventory health.
          </p>
        </div>
      </div>

      {/* Row 1: Daily Fulfillment Volume & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Volume Bar Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Output</span>
              <h2 className="text-lg font-bold text-slate-900">Order Fulfillment Volume (On-Time vs Delayed)</h2>
            </div>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl">
              95.6% Weekly SLA
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="onTime" name="On-Time Orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delayed" name="Delayed SLA" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution Pie */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority Mix</span>
            <h2 className="text-lg font-bold text-slate-900">Active Order Priorities</h2>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {priorityPieData.map(p => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-slate-600">{p.name}: <strong className="text-slate-900">{p.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Category Inventory & Packing Station Load */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Stock Distribution */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stock Health</span>
            <h2 className="text-lg font-bold text-slate-900">Category Inventory Health Breakdown</h2>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="healthy" name="Healthy Stock" stackId="a" fill="#10b981" />
                <Bar dataKey="lowStock" name="Low Stock" stackId="a" fill="#f59e0b" />
                <Bar dataKey="outOfStock" name="Out of Stock" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Packing Station Utilization Bar */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Conveyor Load</span>
            <h2 className="text-lg font-bold text-slate-900">Packing Station Utilization (%)</h2>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="station" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="utilization" name="Capacity Load %" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
