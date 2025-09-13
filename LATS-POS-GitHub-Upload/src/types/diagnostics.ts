// Diagnostics Module TypeScript Types

export interface DiagnosticRequest {
  id: string;
  title: string;
  created_by: string;
  assigned_to?: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'submitted_for_review' | 'admin_reviewed';
  created_at: string;
  updated_at: string;
  // Joined fields
  created_by_user?: {
    id: string;
    name: string;
    username: string;
  };
  assigned_to_user?: {
    id: string;
    name: string;
    username: string;
  };
  devices?: DiagnosticDevice[];
  device_count?: number;
  passed_devices?: number;
  failed_devices?: number;
  pending_devices?: number;
}

export interface DiagnosticDevice {
  id: string;
  diagnostic_request_id: string;
  device_name: string;
  serial_number?: string;
  model?: string;
  notes?: string;
  result_status: 'pending' | 'passed' | 'failed' | 'partially_failed' | 'submitted_for_review' | 'repair_required' | 'replacement_required' | 'no_action_required' | 'escalated' | 'admin_reviewed' | 'sent_to_care';
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  // Admin feedback fields
  admin_feedback?: string;
  next_action?: 'repair' | 'replace' | 'ignore' | 'escalate';
  feedback_submitted_at?: string;
  feedback_submitted_by?: string;
  // Repair fields
  repair_completed_at?: string;
  repair_notes?: string;
  parts_used?: string;
  repair_time?: string;
  // Joined fields
  checks?: DiagnosticCheck[];
  check_count?: number;
  passed_checks?: number;
  failed_checks?: number;
}

export interface DiagnosticCheck {
  id: string;
  diagnostic_device_id: string;
  test_item: string;
  result: 'passed' | 'failed';
  remarks?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticTemplate {
  id: string;
  device_type: string;
  checklist_items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  description: string;
}

export interface CreateDiagnosticRequestData {
  title: string;
  assigned_to?: string;
  notes?: string;
  devices: CreateDiagnosticDeviceData[];
}

export interface CreateDiagnosticDeviceData {
  device_name: string;
  brand?: string;
  serial_number?: string;
  model?: string;
  notes?: string;
  quantity?: number;
  individual_serials?: string[];
  template_id?: string;
}

export interface UpdateDiagnosticCheckData {
  test_item: string;
  result: 'passed' | 'failed';
  remarks?: string;
  image_url?: string;
}

export interface DiagnosticFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'submitted_for_review' | 'admin_reviewed';
  assigned_to?: string;
  created_by?: string;
  result_status?: 'passed' | 'failed' | 'partially_failed' | 'pending' | 'submitted_for_review';
  date_from?: string;
  date_to?: string;
}

export interface DiagnosticStats {
  total_requests: number;
  pending_requests: number;
  in_progress_requests: number;
  completed_requests: number;
  total_devices: number;
  passed_devices: number;
  failed_devices: number;
  partially_failed_devices: number;
  pending_devices: number;
}

export interface AdminFeedbackData {
  next_action: 'repair' | 'replace' | 'ignore' | 'escalate';
  admin_feedback: string;
}

export interface UpdateAdminFeedbackData {
  device_id: string;
  next_action: 'repair' | 'replace' | 'ignore' | 'escalate';
  admin_feedback: string;
}

export interface MarkActionCompletedData {
  device_id: string;
  completion_notes?: string;
  parts_used?: string;
  repair_time?: string;
  next_action: 'repair' | 'replace' | 'ignore' | 'escalate';
}

// Device type constants
export const DEVICE_TYPES = {
  LAPTOP: 'laptop',
  PRINTER: 'printer',
  MONITOR: 'monitor',
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  PHONE: 'phone',
  OTHER: 'other'
} as const;

export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];

// Status constants
export const DIAGNOSTIC_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SUBMITTED_FOR_REVIEW: 'submitted_for_review',
  ADMIN_REVIEWED: 'admin_reviewed'
} as const;

export const RESULT_STATUS = {
  PENDING: 'pending',
  PASSED: 'passed',
  FAILED: 'failed',
  PARTIALLY_FAILED: 'partially_failed',
  SUBMITTED_FOR_REVIEW: 'submitted_for_review',
  REPAIR_REQUIRED: 'repair_required',
  REPLACEMENT_REQUIRED: 'replacement_required',
  NO_ACTION_REQUIRED: 'no_action_required',
  ESCALATED: 'escalated',
  ADMIN_REVIEWED: 'admin_reviewed',
  SENT_TO_CARE: 'sent_to_care'
} as const;

export const NEXT_ACTION = {
  REPAIR: 'repair',
  REPLACE: 'replace',
  IGNORE: 'ignore',
  ESCALATE: 'escalate'
} as const;

export type NextAction = typeof NEXT_ACTION[keyof typeof NEXT_ACTION];