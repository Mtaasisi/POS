// Temporary status mapping to handle database constraint issues
// This will be removed once the database migration is applied

export const mapStatusForDatabase = (status: string): string => {
  // Map new statuses to existing ones until migration is applied
  switch (status) {
    case 'parts-arrived':
      console.warn('Mapping parts-arrived to awaiting-parts (temporary workaround)');
      return 'awaiting-parts';
    case 'process-payments':
      console.warn('Mapping process-payments to repair-complete (temporary workaround)');
      return 'repair-complete';
    default:
      return status;
  }
};

export const mapStatusFromDatabase = (status: string): string => {
  // This is a one-way mapping for now
  // We'll need to track the original status separately if needed
  return status;
};

export const isNewStatus = (status: string): boolean => {
  return status === 'parts-arrived' || status === 'process-payments';
};
