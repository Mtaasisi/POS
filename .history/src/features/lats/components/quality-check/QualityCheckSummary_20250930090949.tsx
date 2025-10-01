import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Package, FileText } from 'lucide-react';
import { QualityCheckService } from '../../services/qualityCheckService';
import type { QualityCheckSummary as QualityCheckSummaryType } from '../../types/quality-check';

interface QualityCheckSummaryProps {
  purchaseOrderId: string;
  onViewDetails?: (qualityCheckId: string) => void;
}

export const QualityCheckSummary: React.FC<QualityCheckSummaryProps> = ({
  purchaseOrderId,
  onViewDetails
}) => {
  const [summary, setSummary] = useState<QualityCheckSummaryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [purchaseOrderId]);

  const loadSummary = async () => {
    setIsLoading(true);
    const result = await QualityCheckService.getQualityCheckSummary(purchaseOrderId);
    if (result.success && result.data) {
      setSummary(result.data);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-gray-400" />
          <p className="text-gray-600">No quality check performed yet</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const passRate = summary.totalItems > 0 
    ? Math.round((summary.passedItems / summary.totalItems) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold">Quality Check Summary</h3>
              {summary.checkedAt && (
                <p className="text-sm text-gray-500">
                  Checked on {new Date(summary.checkedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full border ${getStatusColor(summary.status)}`}>
            <div className="flex items-center gap-2">
              {getStatusIcon(summary.status)}
              <span className="font-medium capitalize">{summary.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Items */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-gray-600" />
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.totalItems}</p>
          </div>

          {/* Passed */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700">Passed</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{summary.passedItems}</p>
          </div>

          {/* Failed */}
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">Failed</p>
            </div>
            <p className="text-2xl font-bold text-red-700">{summary.failedItems}</p>
          </div>

          {/* Pending */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">Pending</p>
            </div>
            <p className="text-2xl font-bold text-yellow-700">{summary.pendingItems}</p>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Pass Rate</span>
            <span className="text-sm font-bold">{passRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                passRate >= 90 ? 'bg-green-500' : passRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${passRate}%` }}
            ></div>
          </div>
        </div>

        {/* Overall Result */}
        {summary.overallResult && (
          <div className={`p-4 rounded-lg border ${
            summary.overallResult === 'pass'
              ? 'bg-green-50 border-green-200'
              : summary.overallResult === 'fail'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              {summary.overallResult === 'pass' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {summary.overallResult === 'fail' && <XCircle className="w-5 h-5 text-red-600" />}
              {summary.overallResult === 'conditional' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
              <div>
                <p className="font-medium">
                  {summary.overallResult === 'pass' && 'All items passed quality check'}
                  {summary.overallResult === 'fail' && 'Some items failed quality check'}
                  {summary.overallResult === 'conditional' && 'Conditional approval required'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* View Details Button */}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(summary.qualityCheckId)}
            className="mt-4 w-full px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            View Detailed Report
          </button>
        )}
      </div>
    </div>
  );
};
