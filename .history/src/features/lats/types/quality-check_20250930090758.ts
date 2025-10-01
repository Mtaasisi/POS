// Quality Check Type Definitions

export interface QualityCheckTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'electronics' | 'accessories' | 'general' | 'custom';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QualityCheckCriteria {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  isRequired: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PurchaseOrderQualityCheck {
  id: string;
  purchaseOrderId: string;
  templateId?: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'partial';
  overallResult?: 'pass' | 'fail' | 'conditional';
  checkedBy?: string;
  checkedAt?: string;
  notes?: string;
  signature?: string;
  createdAt: string;
  updatedAt: string;
  template?: QualityCheckTemplate;
}

export interface QualityCheckItem {
  id: string;
  qualityCheckId: string;
  purchaseOrderItemId: string;
  criteriaId?: string;
  criteriaName: string;
  result: 'pass' | 'fail' | 'na';
  quantityChecked: number;
  quantityPassed: number;
  quantityFailed: number;
  defectType?: string;
  defectDescription?: string;
  actionTaken?: 'accept' | 'reject' | 'return' | 'replace' | 'repair';
  notes?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  criteria?: QualityCheckCriteria;
  purchaseOrderItem?: {
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    product?: {
      name: string;
      sku: string;
    };
    variant?: {
      name: string;
      sku: string;
    };
  };
}

export interface QualityCheckSummary {
  qualityCheckId: string;
  status: string;
  overallResult?: string;
  checkedBy?: string;
  checkedAt?: string;
  totalItems: number;
  passedItems: number;
  failedItems: number;
  pendingItems: number;
}

export interface CreateQualityCheckParams {
  purchaseOrderId: string;
  templateId: string;
  checkedBy: string;
}

export interface UpdateQualityCheckItemParams {
  id: string;
  result: 'pass' | 'fail' | 'na';
  quantityChecked: number;
  quantityPassed: number;
  quantityFailed: number;
  defectType?: string;
  defectDescription?: string;
  actionTaken?: 'accept' | 'reject' | 'return' | 'replace' | 'repair';
  notes?: string;
  images?: string[];
}

export interface CompleteQualityCheckParams {
  qualityCheckId: string;
  notes?: string;
  signature?: string;
}
