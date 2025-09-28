import { RepairPart } from './repairValidation';

export interface AutoProgressionResult {
  shouldProgress: boolean;
  nextStatus: string | null;
  message: string;
}

/**
 * Determines if device should automatically progress to next status when all parts are received
 */
export function shouldAutoProgress(parts: RepairPart[], currentStatus: string): AutoProgressionResult {
  console.log('🔄 [AUTO-PROGRESSION] Checking auto-progression:', {
    partsCount: parts?.length || 0,
    currentStatus,
    parts: parts?.map(p => ({ id: p.id, name: p.name, status: p.status }))
  });

  if (!parts || parts.length === 0) {
    return {
      shouldProgress: false,
      nextStatus: null,
      message: 'No parts to monitor'
    };
  }

  // Check if all parts are now ready (received or used)
  const allPartsReady = parts.every(part => 
    part.status === 'received' || part.status === 'used'
  );

  console.log('🔄 [AUTO-PROGRESSION] Parts readiness check:', {
    allPartsReady,
    partsStatuses: parts.map(p => ({ name: p.name, status: p.status }))
  });

  if (!allPartsReady) {
    return {
      shouldProgress: false,
      nextStatus: null,
      message: 'Not all parts are ready yet'
    };
  }

  // Define automatic progression rules
  const autoProgressionRules: { [key: string]: string } = {
    'diagnosis-started': 'in-repair',        // If parts were needed during diagnosis, start repair
    'awaiting-parts': 'parts-arrived',      // If waiting for parts, mark as parts arrived
    'parts-arrived': 'in-repair'            // If parts just arrived, start repair automatically
  };

  const nextStatus = autoProgressionRules[currentStatus];
  
  console.log('🔄 [AUTO-PROGRESSION] Progression rule check:', {
    currentStatus,
    nextStatus,
    hasRule: !!nextStatus
  });
  
  if (nextStatus) {
    return {
      shouldProgress: true,
      nextStatus,
      message: `All parts received! Auto-progressing from ${currentStatus} to ${nextStatus}`
    };
  }

  return {
    shouldProgress: false,
    nextStatus: null,
    message: 'No auto-progression rule for current status'
  };
}

/**
 * Checks if parts status has changed to trigger auto-progression
 */
export function checkPartsStatusChange(
  previousParts: RepairPart[], 
  currentParts: RepairPart[]
): boolean {
  if (!previousParts || !currentParts) {
    return false;
  }

  if (previousParts.length !== currentParts.length) {
    return true;
  }

  // Check if any part status has changed to 'received' or 'used'
  for (let i = 0; i < currentParts.length; i++) {
    const prevPart = previousParts[i];
    const currPart = currentParts[i];
    
    if (prevPart && currPart && prevPart.status !== currPart.status) {
      // Status changed - check if it's now received or used
      if (currPart.status === 'received' || currPart.status === 'used') {
        console.log('🔄 [AUTO-PROGRESSION] Part status changed to ready:', {
          partName: currPart.name,
          previousStatus: prevPart.status,
          currentStatus: currPart.status
        });
        return true;
      }
    }
  }

  return false;
}
