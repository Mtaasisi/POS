import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, TrendingUp, Clock, Star, ExternalLink, Award, Target } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

interface ServiceWidgetProps {
  className?: string;
}

interface ServiceMetrics {
  activeServices: number;
  completionRate: number;
  averageDuration: number;
  popularServices: Array<{
    name: string;
    count: number;
    revenue: number;
    rating: number;
  }>;
  todayCompleted: number;
  inProgress: number;
  avgRating: number;
}

export const ServiceWidget: React.FC<ServiceWidgetProps> = ({ className }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<ServiceMetrics>({
    activeServices: 0,
    completionRate: 0,
    averageDuration: 0,
    popularServices: [],
    todayCompleted: 0,
    inProgress: 0,
    avgRating: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServiceMetrics();
  }, []);

  const loadServiceMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - would be replaced with actual service API calls
      const mockMetrics: ServiceMetrics = {
        activeServices: 12,
        completionRate: 94,
        averageDuration: 75, // minutes
        popularServices: [
          {
            name: 'Screen Repair',
            count: 28,
            revenue: 850000,
            rating: 4.8
          },
          {
            name: 'Battery Replace',
            count: 19,
            revenue: 456000,
            rating: 4.6
          },
          {
            name: 'Data Recovery',
            count: 12,
            revenue: 380000,
            rating: 4.9
          }
        ],
        todayCompleted: 8,
        inProgress: 5,
        avgRating: 4.7
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading service metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={10}
            className={`${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs font-medium text-gray-700 ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg">
            <Wrench className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Service Performance</h3>
            <p className="text-sm text-gray-600">
              {metrics.activeServices} services • {metrics.completionRate}% completion
            </p>
          </div>
        </div>
      </div>

      {/* Service Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-700">{metrics.todayCompleted}</p>
          <p className="text-xs text-green-600">Completed</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-lg font-bold text-blue-700">{metrics.inProgress}</p>
          <p className="text-xs text-blue-600">In Progress</p>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded-lg">
          <p className="text-lg font-bold text-yellow-700">{formatDuration(metrics.averageDuration)}</p>
          <p className="text-xs text-yellow-600">Avg Time</p>
        </div>
      </div>

      {/* Average Rating */}
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">Service Quality</p>
            {renderStarRating(metrics.avgRating)}
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp size={12} />
            <span className="text-xs font-medium">{metrics.completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Popular Services */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Popular Services</h4>
        {metrics.popularServices.slice(0, 3).map((service, index) => (
          <div key={index} className="p-2 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {service.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStarRating(service.rating)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {service.count} jobs
                </p>
                <p className="text-xs text-green-600">
                  {formatCurrency(service.revenue)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <GlassButton
          onClick={() => navigate('/services')}
          variant="ghost"
          size="sm"
          className="flex-1"
          icon={<ExternalLink size={14} />}
        >
          Manage Services
        </GlassButton>
        <GlassButton
          onClick={() => navigate('/services/reports')}
          variant="ghost"
          size="sm"
          icon={<Target size={14} />}
        >
          Reports
        </GlassButton>
      </div>
    </GlassCard>
  );
};