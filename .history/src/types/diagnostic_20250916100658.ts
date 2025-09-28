export interface DiagnosticProblem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface DiagnosticChecklistItem {
  id: string;
  problemId: string;
  title: string;
  description?: string;
  orderIndex: number;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceDiagnosticChecklist {
  id: string;
  deviceId: string;
  problemId: string;
  checklistData: Record<string, boolean>;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticChecklistWithItems {
  problem: DiagnosticProblem;
  items: DiagnosticChecklistItem[];
}

export interface DiagnosticChecklistProgress {
  totalItems: number;
  completedItems: number;
  requiredItems: number;
  completedRequiredItems: number;
  isComplete: boolean;
  canProceed: boolean;
}
