import { RepairPart } from '../features/repair/services/repairPartsApi';

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates if repair can be started based on parts availability
 * @param repairParts - Array of repair parts for the device
 * @returns ValidationResult with validation status and message
 */
export const validateRepairStart = (repairParts: RepairPart[]): ValidationResult => {
  // If no parts are requested, allow the transition
  if (repairParts.length === 0) {
    return { valid: true };
  }
  
  // If parts are requested, they MUST be received before repair can start
  const pendingParts = repairParts.filter(part => 
    part.status === 'needed' || part.status === 'ordered'
  );
  
  if (pendingParts.length > 0) {
    return { 
      valid: false, 
      message: `Cannot start repair. ${pendingParts.length} parts are still pending. Please mark parts as received first using the "Parts Received" button.` 
    };
  }
  
  // Check if at least some parts are received
  const receivedParts = repairParts.filter(part => 
    part.status === 'received' || part.status === 'used'
  );
  
  if (receivedParts.length === 0) {
    return { 
      valid: false, 
      message: `No parts have been received yet. Please use the "Parts Received" button to mark parts as received before starting repair.` 
    };
  }
  
  return { valid: true };
};

/**
 * Checks if device has parts that need to be ordered
 * @param repairParts - Array of repair parts for the device
 * @returns boolean indicating if parts need to be ordered
 */
export const hasNeededParts = (repairParts: RepairPart[]): boolean => {
  return repairParts.some(part => part.status === 'needed' || part.status === 'ordered');
};

/**
 * Checks if all parts are ready (received or used)
 * @param repairParts - Array of repair parts for the device
 * @returns boolean indicating if all parts are ready
 */
export const allPartsReady = (repairParts: RepairPart[]): boolean => {
  return repairParts.length > 0 && repairParts.every(part => 
    part.status === 'received' || part.status === 'used'
  );
};
