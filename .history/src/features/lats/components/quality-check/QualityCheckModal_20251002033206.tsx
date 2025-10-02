import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Package, CheckCircle, XCircle, MapPin, TrendingUp } from 'lucide-react';
import { QualityCheckService } from '../../services/qualityCheckService';
import type { QualityCheckItem, QualityCheckTemplate } from '../../types/quality-check';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabaseClient';

interface QualityCheckModalProps {
  purchaseOrderId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const QualityCheckModal: React.FC<QualityCheckModalProps> = ({
  purchaseOrderId,
  isOpen,
  onClose,
  onComplete
}) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<'template' | 'inspect' | 'complete' | 'inventory'>('template');
  const [templates, setTemplates] = useState<QualityCheckTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [qualityCheckId, setQualityCheckId] = useState<string>('');
  const [checkItems, setCheckItems] = useState<QualityCheckItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Inventory step state
  const [profitMargin, setProfitMargin] = useState(30);
  const [defaultLocation, setDefaultLocation] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    console.log('🔄 Loading quality check templates...');
    try {
      const result = await QualityCheckService.getTemplates();
      if (result.success && result.data) {
        console.log('✅ Templates loaded:', result.data.length);
        setTemplates(result.data);
        if (result.data.length > 0) {
          setSelectedTemplate(result.data[0].id);
        }
      } else {
        console.warn('⚠️ Failed to load templates:', result.message);
        // Create a fallback template
        const fallbackTemplate = {
          id: 'fallback-general',
          name: 'General Quality Check',
          description: 'Basic quality check for all items',
          category: 'general' as const,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setTemplates([fallbackTemplate]);
        setSelectedTemplate(fallbackTemplate.id);
      }
    } catch (error) {
      console.error('❌ Exception loading templates:', error);
      // Create a fallback template
      const fallbackTemplate = {
        id: 'fallback-general',
        name: 'General Quality Check',
        description: 'Basic quality check for all items',
        category: 'general' as const,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTemplates([fallbackTemplate]);
      setSelectedTemplate(fallbackTemplate.id);
    }
  };

  const handleStartQualityCheck = async () => {
    if (!selectedTemplate || !currentUser) {
      console.error('❌ Missing required data for quality check:', { selectedTemplate, currentUser });
      return;
    }

    console.log('🔄 Starting quality check...', { purchaseOrderId, selectedTemplate, userId: currentUser.id });
    setIsLoading(true);
    
    try {
      const result = await QualityCheckService.createQualityCheck({
        purchaseOrderId,
        templateId: selectedTemplate,
        checkedBy: currentUser.id
      });

      if (result.success && result.data) {
        console.log('✅ Quality check created successfully:', result.data);
        setQualityCheckId(result.data);
        
        const itemsResult = await QualityCheckService.getQualityCheckItems(result.data);
        if (itemsResult.success && itemsResult.data) {
          console.log('✅ Quality check items loaded:', itemsResult.data.length);
          setCheckItems(itemsResult.data);
          setStep('inspect');
        } else {
          console.error('❌ Failed to load quality check items:', itemsResult.message);
          // Continue anyway - items might load later
          setStep('inspect');
        }
      } else {
        console.error('❌ Failed to create quality check:', result.message);
        // Show error to user
        alert(`Failed to start quality check: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Exception during quality check creation:', error);
      alert(`Error starting quality check: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    result: 'pass' | 'fail' | 'na',
    quantityChecked: number,
    quantityPassed: number,
    quantityFailed: number,
    defectType?: string,
    defectDescription?: string,
    actionTaken?: 'accept' | 'reject' | 'return' | 'replace' | 'repair',
    notes?: string
  ) => {
    const updateResult = await QualityCheckService.updateQualityCheckItem({
      id: itemId,
      result,
      quantityChecked,
      quantityPassed,
      quantityFailed,
      defectType,
      defectDescription,
      actionTaken,
      notes
    });

    if (updateResult.success) {
      // Update local state
      setCheckItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, result, quantityChecked, quantityPassed, quantityFailed, defectType, defectDescription, actionTaken, notes }
            : item
        )
      );

      // Move to next item or complete
      if (currentItemIndex < checkItems.length - 1) {
        setCurrentItemIndex(prev => prev + 1);
      } else {
        setStep('complete');
      }
    }
  };

  const handleComplete = async () => {
    if (!qualityCheckId) return;

    setIsLoading(true);
    const result = await QualityCheckService.completeQualityCheck({
      qualityCheckId,
      notes
    });

    if (result.success) {
      // Calculate overall result
      const failedItems = checkItems.filter(item => item.result === 'fail').length;
      
      let resultType: 'pass' | 'fail' | 'conditional' = 'pass';
      if (failedItems === checkItems.length) {
        resultType = 'fail';
      } else if (failedItems > 0) {
        resultType = 'conditional';
      }
      
      
      // Move to inventory step if passed
      if (resultType === 'pass') {
        setStep('inventory');
      } else {
        // If failed, just close
        onComplete();
        onClose();
      }
    }
    setIsLoading(false);
  };

  const handleAddToInventory = async () => {
    if (!qualityCheckId || !currentUser) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('add_quality_items_to_inventory_v2', {
        p_quality_check_id: qualityCheckId,
        p_purchase_order_id: purchaseOrderId,
        p_user_id: currentUser.id,
        p_profit_margin_percentage: profitMargin,
        p_default_location: defaultLocation || null
      });

      if (error) throw error;

      const result = data as any; // RPC returns JSONB
      if (result && result.success) {
        console.log('✅ Items added to inventory:', result);
        onComplete();
        onClose();
      } else {
        console.error('❌ Failed to add to inventory:', result?.message);
        alert(result?.message || 'Failed to add items to inventory');
      }
    } catch (error) {
      console.error('❌ Error adding to inventory:', error);
      alert('Error adding items to inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const currentItem = checkItems[currentItemIndex];
  const template = templates.find(t => t.id === selectedTemplate);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Quality Check</h2>
              <p className="text-sm text-gray-500">
                {step === 'template' && 'Select Template'}
                {step === 'inspect' && `Item ${currentItemIndex + 1} of ${checkItems.length}`}
                {step === 'complete' && 'Complete Check'}
                {step === 'inventory' && 'Add to Inventory'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Step 1: Select Template */}
          {step === 'template' && (
            <div className="space-y-4">
              <h3 className="font-medium">Choose Quality Check Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 border rounded-lg text-left transition ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                    <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-gray-100">
                      {template.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Inspect Items */}
          {step === 'inspect' && currentItem && (
            <QualityCheckItemForm
              item={currentItem}
              onSubmit={handleUpdateItem}
              onSkip={() => setCurrentItemIndex(prev => prev + 1)}
            />
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-medium text-green-800">All items checked!</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-2xl font-semibold">{checkItems.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Passed</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {checkItems.filter(i => i.result === 'pass').length}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-semibold text-red-600">
                      {checkItems.filter(i => i.result === 'fail').length}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Final Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Add any final notes..."
                />
              </div>
            </div>
          )}

          {/* Step 4: Inventory */}
          {step === 'inventory' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Quality Check Passed!</p>
                    <p className="text-sm text-blue-600">Set selling prices and add items to inventory</p>
                  </div>
                </div>
              </div>

              {/* Profit Margin */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Profit Margin (%)
                </label>
                <input
                  type="number"
                  value={profitMargin || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setProfitMargin(isNaN(value) ? 0 : value);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="30"
                  min="0"
                  max="100"
                  step="5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selling price will be calculated as: Cost Price × (1 + {profitMargin}%)
                </p>
              </div>

              {/* Default Location */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Default Location (Optional)
                </label>
                <input
                  type="text"
                  value={defaultLocation}
                  onChange={(e) => setDefaultLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Warehouse A, Shelf 3"
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items to add:</span>
                    <span className="font-medium">{checkItems.filter(i => i.result === 'pass').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit margin:</span>
                    <span className="font-medium">{profitMargin}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{defaultLocation || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {step === 'template' && (
              <button
                onClick={handleStartQualityCheck}
                disabled={!selectedTemplate || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Starting...' : 'Start Check'}
              </button>
            )}
            {step === 'complete' && (
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Completing...' : 'Complete Check'}
              </button>
            )}
            {step === 'inventory' && (
              <button
                onClick={handleAddToInventory}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                {isLoading ? 'Adding to Inventory...' : 'Add to Inventory'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Quality Check Item Form Component
interface QualityCheckItemFormProps {
  item: QualityCheckItem;
  onSubmit: (
    itemId: string,
    result: 'pass' | 'fail' | 'na',
    quantityChecked: number,
    quantityPassed: number,
    quantityFailed: number,
    defectType?: string,
    defectDescription?: string,
    actionTaken?: 'accept' | 'reject' | 'return' | 'replace' | 'repair',
    notes?: string
  ) => void;
  onSkip: () => void;
}

const QualityCheckItemForm: React.FC<QualityCheckItemFormProps> = ({ item, onSubmit, onSkip }) => {
  const [result, setResult] = useState<'pass' | 'fail' | 'na'>('pass');
  const [quantityChecked, setQuantityChecked] = useState(item.purchaseOrderItem?.quantity || 0);
  const [quantityPassed, setQuantityPassed] = useState(item.purchaseOrderItem?.quantity || 0);
  const [quantityFailed, setQuantityFailed] = useState(0);
  const [defectType, setDefectType] = useState('');
  const [defectDescription, setDefectDescription] = useState('');
  const [actionTaken, setActionTaken] = useState<'accept' | 'reject' | 'return' | 'replace' | 'repair'>('accept');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit(
      item.id,
      result,
      quantityChecked,
      quantityPassed,
      quantityFailed,
      defectType || undefined,
      defectDescription || undefined,
      actionTaken,
      notes || undefined
    );
  };

  return (
    <div className="space-y-6">
      {/* Item Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">
          {item.purchaseOrderItem?.product?.name} - {item.purchaseOrderItem?.variant?.name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>SKU: {item.purchaseOrderItem?.variant?.sku}</span>
          <span>Qty: {item.purchaseOrderItem?.quantity}</span>
        </div>
      </div>

      {/* Criteria */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900">{item.criteriaName}</h4>
        {item.criteria?.description && (
          <p className="text-sm text-blue-700 mt-1">{item.criteria.description}</p>
        )}
      </div>

      {/* Result Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">Check Result</label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              setResult('pass');
              setQuantityPassed(quantityChecked);
              setQuantityFailed(0);
            }}
            className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
              result === 'pass' ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
          >
            <CheckCircle className={`w-6 h-6 ${result === 'pass' ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={result === 'pass' ? 'text-green-700' : 'text-gray-600'}>Pass</span>
          </button>
          <button
            onClick={() => setResult('fail')}
            className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
              result === 'fail' ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}
          >
            <XCircle className={`w-6 h-6 ${result === 'fail' ? 'text-red-600' : 'text-gray-400'}`} />
            <span className={result === 'fail' ? 'text-red-700' : 'text-gray-600'}>Fail</span>
          </button>
          <button
            onClick={() => setResult('na')}
            className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
              result === 'na' ? 'border-gray-500 bg-gray-50' : 'border-gray-200'
            }`}
          >
            <AlertCircle className={`w-6 h-6 ${result === 'na' ? 'text-gray-600' : 'text-gray-400'}`} />
            <span className={result === 'na' ? 'text-gray-700' : 'text-gray-600'}>N/A</span>
          </button>
        </div>
      </div>

      {/* Quantities */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Checked</label>
          <input
            type="number"
            value={quantityChecked || ''}
            onChange={(e) => {
              const value = Number(e.target.value);
              setQuantityChecked(isNaN(value) ? 0 : value);
            }}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Passed</label>
          <input
            type="number"
            value={quantityPassed || ''}
            onChange={(e) => {
              const value = Number(e.target.value);
              setQuantityPassed(isNaN(value) ? 0 : value);
            }}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Failed</label>
          <input
            type="number"
            value={quantityFailed || ''}
            onChange={(e) => {
              const value = Number(e.target.value);
              setQuantityFailed(isNaN(value) ? 0 : value);
            }}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Defect Details (if failed) */}
      {result === 'fail' && (
        <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">Defect Type</label>
            <select
              value={defectType}
              onChange={(e) => setDefectType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select defect type</option>
              <option value="physical_damage">Physical Damage</option>
              <option value="functional_issue">Functional Issue</option>
              <option value="missing_parts">Missing Parts</option>
              <option value="cosmetic_defect">Cosmetic Defect</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Defect Description</label>
            <textarea
              value={defectDescription}
              onChange={(e) => setDefectDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Describe the defect..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Action Taken</label>
            <select
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="accept">Accept</option>
              <option value="reject">Reject</option>
              <option value="return">Return to Supplier</option>
              <option value="replace">Request Replacement</option>
              <option value="repair">Send for Repair</option>
            </select>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
          placeholder="Add any notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );
};
