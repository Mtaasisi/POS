import React from 'react';
import { 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  Eye, 
  Users, 
  AlertTriangle, 
  MessageSquare 
} from 'lucide-react';
import { STATUS_COLORS, ICON_COLORS } from '../../shared/constants/theme';

interface DiagnosticStatusBadgeProps {
  status: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const DiagnosticStatusBadge: React.FC<DiagnosticStatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md'
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'submitted_for_review':
        return <Eye className="h-4 w-4 text-purple-500" />;
      case 'ready_for_customer_care':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'repair_required':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'replacement_required':
        return <RefreshCw className="h-4 w-4 text-red-500" />;
      case 'escalated':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'no_action_required':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'admin_reviewed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'submitted_for_review':
        return 'Submitted for Review';
      case 'ready_for_customer_care':
        return 'Ready for Customer Care';
      case 'repair_required':
        return 'Repair Required';
      case 'replacement_required':
        return 'Replacement Required';
      case 'escalated':
        return 'Escalated';
      case 'no_action_required':
        return 'No Action Required';
      case 'admin_reviewed':
        return 'Admin Reviewed';
      default:
        return 'Unknown';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-2 py-1 text-xs';
    }
  };

  const statusColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;
  const sizeClasses = getSizeClasses(size);

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${statusColor} ${sizeClasses}`}>
      {showIcon && getStatusIcon(status)}
      {getStatusText(status)}
    </span>
  );
};

export default DiagnosticStatusBadge;
