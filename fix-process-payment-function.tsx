// Fixed processPayment function for DeviceRepairDetailModal
// This version handles the 400 error by ensuring all data is valid

const processPayment = async (paymentData: any[], totalPaid?: number) => {
  if (!selectedPendingPayment || !device) return;
  
  try {
    console.log('🔧 Processing payment for:', selectedPendingPayment.id);
    console.log('📊 Payment data:', paymentData);
    
    // Process each payment
    const results = await Promise.all(
      paymentData.map(async (payment) => {
        // Build update data with validation and proper data types
        const updateData: any = {
          status: 'completed',
          updated_at: new Date().toISOString()
        };
        
        // Only add fields that are valid and not empty
        if (payment.amount && !isNaN(parseFloat(payment.amount))) {
          updateData.amount = parseFloat(payment.amount);
        }
        
        if (payment.paymentMethod && payment.paymentMethod.trim()) {
          updateData.method = payment.paymentMethod.trim();
        }
        
        if (payment.currency && payment.currency.trim()) {
          updateData.currency = payment.currency.trim();
        }
        
        if (payment.reference && payment.reference.trim()) {
          updateData.reference = payment.reference.trim();
        } else {
          updateData.reference = '';
        }
        
        if (payment.notes && payment.notes.trim()) {
          updateData.notes = payment.notes.trim();
        } else {
          updateData.notes = '';
        }
        
        // Only add foreign key fields if they are valid UUIDs
        if (payment.paymentMethodId && 
            payment.paymentMethodId !== 'null' && 
            payment.paymentMethodId !== 'undefined' &&
            payment.paymentMethodId.trim() &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payment.paymentMethodId)) {
          updateData.payment_method_id = payment.paymentMethodId.trim();
        }
        
        if (payment.paymentAccountId && 
            payment.paymentAccountId !== 'null' && 
            payment.paymentAccountId !== 'undefined' &&
            payment.paymentAccountId.trim() &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payment.paymentAccountId)) {
          updateData.payment_account_id = payment.paymentAccountId.trim();
        }
        
        // Set payment_date to current time
        updateData.payment_date = new Date().toISOString();
        
        console.log('🔄 Updating payment with data:', updateData);
        
        const { error } = await supabase
          .from('customer_payments')
          .update(updateData)
          .eq('id', selectedPendingPayment.id);
        
        if (error) {
          console.error('❌ Error processing payment:', error);
          console.error('❌ Update data that failed:', updateData);
          throw error;
        }
        
        console.log('✅ Payment updated successfully');
        return { success: true };
      })
    );
    
    toast.success('Payment processed successfully!');
    setShowPaymentModal(false);
    setSelectedPendingPayment(null);
    
    // Refresh the pending payments list
    if (device?.id) {
      loadPendingPayments(device.id);
    }
    
  } catch (error) {
    console.error('❌ Error in processPayment:', error);
    toast.error('Failed to process payment. Please try again.');
    throw error;
  }
};
