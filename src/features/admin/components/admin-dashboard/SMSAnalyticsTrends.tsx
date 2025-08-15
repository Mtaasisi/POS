import React, { useEffect, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import GlassCard from '../ui/GlassCard';
import { smsService } from '../../../../services/smsService';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const dateRanges = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

const statusColors = {
  sent: '#3b82f6',
  delivered: '#22c55e',
  failed: '#e11d48',
  pending: '#f59e42',
};

export default function SMSAnalyticsTrends() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    setLoading(true);
    smsService.getSMSLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  // Filter logs by date range
  const now = new Date();
  const filteredLogs = logs.filter(log => {
    if (!log.created_at) return false;
    const logDate = new Date(log.created_at);
    return (now - logDate) / (1000 * 60 * 60 * 24) < range;
  });

  // Aggregate for line chart (SMS sent per day)
  const days = Array.from({ length: range }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (range - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  const sentPerDay = days.map(day =>
    filteredLogs.filter(log => log.created_at && log.created_at.startsWith(day)).length
  );

  // Aggregate for pie chart (status distribution)
  const statusCounts = filteredLogs.reduce((acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1;
    return acc;
  }, {});
  const statusLabels = Object.keys(statusCounts);
  const statusData = statusLabels.map(status => statusCounts[status]);
  const statusBgColors = statusLabels.map(status => statusColors[status] || '#888');

  return (
    <GlassCard style={{ marginBottom: 24 }}>
      <h3>SMS Analytics & Trends</h3>
      <div style={{ marginBottom: 16 }}>
        <label>Range: </label>
        <select value={range} onChange={e => setRange(Number(e.target.value))}>
          {dateRanges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      {loading ? (
        <div style={{ padding: 16 }}>Loading analytics...</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <Line
              data={{
                labels: days,
                datasets: [
                  {
                    label: 'SMS Sent',
                    data: sentPerDay,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: true, text: 'SMS Sent Per Day' },
                },
                scales: {
                  x: { title: { display: true, text: 'Date' } },
                  y: { title: { display: true, text: 'Count' }, beginAtZero: true },
                },
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
            <Pie
              data={{
                labels: statusLabels,
                datasets: [
                  {
                    label: 'Status',
                    data: statusData,
                    backgroundColor: statusBgColors,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' },
                  title: { display: true, text: 'Delivery Status Distribution' },
                },
              }}
            />
          </div>
        </div>
      )}
    </GlassCard>
  );
} 