// Repair validation utilities

export interface RepairPart {
  id: string;
  name: string;
  description: string;
  quantity: number;
  cost: number;
  status: 'needed' | 'ordered' | 'accepted' | 'received' | 'used';
  supplier: string;
  estimatedArrival?: string;
  notes?: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates if repair can be started based on parts availability
 */
export function validateRepairStart(parts: RepairPart[]): ValidationResult {
  if (!parts || parts.length === 0) {
    return {
      valid: true,
      message: 'No parts required for this repair'
    };
  }

  // Check if all required parts are received or used
  const requiredParts = parts.filter(part => part.status !== 'used');
  const receivedParts = requiredParts.filter(part => part.status === 'received');
  
  if (requiredParts.length > 0 && receivedParts.length === 0) {
    return {
      valid: false,
      message: 'Cannot start repair: No parts have been received yet'
    };
  }

  // Check if all parts are ready (received or used)
  const allPartsReady = parts.every(part => 
    part.status === 'received' || part.status === 'used'
  );

  if (!allPartsReady) {
    const pendingParts = parts.filter(part => 
      part.status !== 'received' && part.status !== 'used'
    );
    return {
      valid: false,
      message: `Cannot start repair: ${pendingParts.length} part(s) still pending (${pendingParts.map(p => p.status).join(', ')})`
    };
  }

  return {
    valid: true,
    message: 'All parts ready, repair can be started'
  };
}

/**
 * Checks if device has parts that need to be ordered
 */
export function hasNeededParts(parts: RepairPart[]): boolean {
  if (!parts || parts.length === 0) {
    return false;
  }

  // Check if any parts are not yet received or used
  return parts.some(part => 
    part.status !== 'received' && part.status !== 'used'
  );
}

/**
 * Checks if all parts are ready for repair
 */
export function allPartsReady(parts: RepairPart[]): boolean {
  if (!parts || parts.length === 0) {
    return true;
  }

  // All parts must be received or used
  return parts.every(part => 
    part.status === 'received' || part.status === 'used'
  );
}

/**
 * Gets the progress percentage of parts readiness
 */
export function getPartsProgress(parts: RepairPart[]): number {
  if (!parts || parts.length === 0) {
    return 100;
  }

  const readyParts = parts.filter(part => 
    part.status === 'received' || part.status === 'used'
  ).length;

  return Math.round((readyParts / parts.length) * 100);
}

/**
 * Gets parts that are still pending (not received or installed)
 */
export function getPendingParts(parts: RepairPart[]): RepairPart[] {
  if (!parts || parts.length === 0) {
    return [];
  }

  return parts.filter(part => 
    part.status !== 'received' && part.status !== 'used'
  );
}

/**
 * Gets parts that are ready for repair (received or used)
 */
export function getReadyParts(parts: RepairPart[]): RepairPart[] {
  if (!parts || parts.length === 0) {
    return [];
  }

  return parts.filter(part => 
    part.status === 'received' || part.status === 'used'
  );
}

/**
 * Calculates total cost of all parts
 */
export function getTotalPartsCost(parts: RepairPart[]): number {
  if (!parts || parts.length === 0) {
    return 0;
  }

  return parts.reduce((total, part) => total + (part.cost * part.quantity), 0);
}

/**
 * Gets status summary for parts
 */
export function getPartsStatusSummary(parts: RepairPart[]) {
  const summary = {
    total: parts.length,
    needed: 0,
    ordered: 0,
    accepted: 0,
    received: 0,
    used: 0,
    pending: 0
  };

  parts.forEach(part => {
    switch (part.status) {
      case 'needed':
        summary.needed++;
        break;
      case 'ordered':
        summary.ordered++;
        break;
      case 'accepted':
        summary.accepted++;
        break;
      case 'received':
        summary.received++;
        break;
      case 'used':
        summary.used++;
        break;
      default:
        summary.pending++;
    }
  });

  return summary;
}
