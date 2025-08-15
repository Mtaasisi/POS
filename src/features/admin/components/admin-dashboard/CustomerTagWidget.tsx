import React, { useEffect, useState } from 'react';
import { CustomerTagService } from '../../../../services/customerTagService';
import GlassCard from '../ui/GlassCard';

const TAG_LABELS: Record<string, string> = {
  vip: 'VIP',
  loyal: 'Loyal',
  new: 'New',
  'at-risk': 'At-Risk',
  complainer: 'Complainer',
  purchased: 'Purchased',
};

const TAG_COLORS: Record<string, string> = {
  vip: 'bg-yellow-100 text-yellow-800',
  loyal: 'bg-green-100 text-green-800',
  new: 'bg-blue-100 text-blue-800',
  'at-risk': 'bg-orange-100 text-orange-800',
  complainer: 'bg-red-100 text-red-800',
  purchased: 'bg-emerald-100 text-emerald-800',
};

const CustomerTagWidget: React.FC = () => {
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    CustomerTagService.getTagStatistics().then(setStats);
  }, []);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <GlassCard className="p-4">
      <h3 className="text-lg font-bold mb-4">Customer Tag Distribution</h3>
      <div className="space-y-2">
        {Object.entries(stats).length === 0 ? (
          <div className="text-gray-400 text-center py-4">No data</div>
        ) : (
          Object.entries(stats)
            .sort(([, a], [, b]) => b - a)
            .map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-700'}`}>{TAG_LABELS[tag] || tag}</span>
                <span className="font-semibold text-gray-900">
                  {count} <span className="text-xs text-gray-500">({total > 0 ? ((count / total) * 100).toFixed(1) : 0}%)</span>
                </span>
              </div>
            ))
        )}
      </div>
    </GlassCard>
  );
};

export default CustomerTagWidget; 