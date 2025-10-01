import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, XCircle, AlertCircle, Package, FileText, 
  Calendar, User, MessageSquare, Camera, Eye, Download,
  CheckSquare, XSquare, Minus, Clock, Target, Hash
} from 'lucide-react';
import { QualityCheckService } from '../../services/qualityCheckService';
import type { 
  PurchaseOrderQualityCheck, 
  QualityCheckItem, 
  QualityCheckTemplate 
} from '../../types/quality-check';

interface QualityCheckDetailsModalProps {
  qualityCheckId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QualityCheckDetailsModal: React.FC<QualityCheckDetailsModalProps> = ({
  qualityCheckId,
  isOpen,
  onClose
}) => {
  const [qualityCheck, setQualityCheck] = useState<PurchaseOrderQualityCheck | null>(null);
  const [checkItems, setCheckItems] = useState<QualityCheckItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'summary'>('overview');

  useEffect(() => {
    if (isOpen && qualityCheckId && qualityCheckId !== '') {
      loadQualityCheckDetails();
    } else if (isOpen && (!qualityCheckId || qualityCheckId === '')) {
      // Reset state if modal is opened without a valid ID
      setQualityCheck(null);
      setCheckItems([]);
      setIsLoading(false);
    }
  }, [isOpen, qualityCheckId]);

  const loadQualityCheckDetails = async () => {
    // Validate qualityCheckId before making API calls
    if (!qualityCheckId || qualityCheckId === '' || qualityCheckId === 'undefined') {
      console.error('Invalid quality check ID:', qualityCheckId);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Load quality check details
      const qualityCheckResult = await QualityCheckService.getQualityCheck(qualityCheckId);
      if (qualityCheckResult.success && qualityCheckResult.data) {
        setQualityCheck(qualityCheckResult.data);
      }

      // Load quality check items
      const itemsResult = await QualityCheckService.getQualityCheckItems(qualityCheckId);
      if (itemsResult.success && itemsResult.data) {
        setCheckItems(itemsResult.data);
      }
    } catch (error) {
      console.error('Error loading quality check details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'na':
        return <Minus className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'accept':
        return 'bg-green-100 text-green-800';
      case 'reject':
        return 'bg-red-100 text-red-800';
      case 'return':
        return 'bg-orange-100 text-orange-800';
      case 'replace':
        return 'bg-blue-100 text-blue-800';
      case 'repair':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    console.log('Export to PDF functionality coming soon');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold">Quality Check Details</h2>
                <p className="text-sm text-gray-600">
                  Quality Check ID: {qualityCheckId ? qualityCheckId.slice(0, 8) + '...' : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToPDF}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Status Badge */}
          {qualityCheck && (
            <div className="mt-4">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(qualityCheck.status)}`}>
                {qualityCheck.status === 'passed' && <CheckCircle className="w-5 h-5" />}
                {qualityCheck.status === 'failed' && <XCircle className="w-5 h-5" />}
                {qualityCheck.status === 'partial' && <AlertCircle className="w-5 h-5" />}
                <span className="font-medium capitalize">{qualityCheck.status}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'items', label: 'Items', icon: Package },
              { id: 'summary', label: 'Summary', icon: Target }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && qualityCheck && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Quality Check Information</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Checked Date</p>
                            <p className="font-medium">
                              {qualityCheck.checkedAt 
                                ? new Date(qualityCheck.checkedAt).toLocaleDateString()
                                : 'Not completed'
                              }
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Checked By</p>
                            <p className="font-medium">{qualityCheck.checkedBy || 'Not specified'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Target className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Overall Result</p>
                            <p className="font-medium capitalize">{qualityCheck.overallResult || 'Pending'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Template Information</h3>
                      
                      {qualityCheck.template ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Template Name</p>
                            <p className="font-medium">{qualityCheck.template.name}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Category</p>
                            <p className="font-medium capitalize">{qualityCheck.template.category}</p>
                          </div>

                          {qualityCheck.template.description && (
                            <div>
                              <p className="text-sm text-gray-600">Description</p>
                              <p className="font-medium">{qualityCheck.template.description}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">No template information available</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {qualityCheck.notes && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Notes</h3>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-1" />
                          <p className="text-gray-700">{qualityCheck.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items Tab */}
              {activeTab === 'items' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Quality Check Items</h3>
                  
                  {checkItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No quality check items found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {checkItems.map((item, index) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium">{item.criteriaName}</h4>
                                {item.purchaseOrderItem?.product && (
                                  <p className="text-sm text-gray-600">
                                    {item.purchaseOrderItem.product.name}
                                    {item.purchaseOrderItem.variant && ` - ${item.purchaseOrderItem.variant.name}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getResultIcon(item.result)}
                              <span className="font-medium capitalize">{item.result}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Checked</p>
                              <p className="font-bold">{item.quantityChecked}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Passed</p>
                              <p className="font-bold text-green-600">{item.quantityPassed}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Failed</p>
                              <p className="font-bold text-red-600">{item.quantityFailed}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Pass Rate</p>
                              <p className="font-bold">
                                {item.quantityChecked > 0 
                                  ? Math.round((item.quantityPassed / item.quantityChecked) * 100)
                                  : 0}%
                              </p>
                            </div>
                          </div>

                          {/* Defect Information */}
                          {(item.defectType || item.defectDescription) && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <h5 className="font-medium text-red-800 mb-2">Defect Information</h5>
                              {item.defectType && (
                                <p className="text-sm text-red-700">
                                  <span className="font-medium">Type:</span> {item.defectType}
                                </p>
                              )}
                              {item.defectDescription && (
                                <p className="text-sm text-red-700 mt-1">
                                  <span className="font-medium">Description:</span> {item.defectDescription}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Action Taken */}
                          {item.actionTaken && (
                            <div className="mb-3">
                              <span className="text-sm text-gray-600">Action Taken: </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(item.actionTaken)}`}>
                                {item.actionTaken}
                              </span>
                            </div>
                          )}

                          {/* Notes */}
                          {item.notes && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-600 mb-1">Notes:</p>
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{item.notes}</p>
                            </div>
                          )}

                          {/* Images */}
                          {item.images && item.images.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Images ({item.images.length})</p>
                              <div className="flex gap-2">
                                {item.images.map((image, imgIndex) => (
                                  <button
                                    key={imgIndex}
                                    className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300"
                                  >
                                    <Camera className="w-6 h-6 text-gray-400" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Summary Tab */}
              {activeTab === 'summary' && qualityCheck && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-gray-900">Quality Check Summary</h3>
                  
                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-2xl font-bold">{checkItems.length}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-sm text-green-600">Passed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {checkItems.filter(item => item.result === 'pass').length}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg text-center">
                      <p className="text-sm text-red-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">
                        {checkItems.filter(item => item.result === 'fail').length}
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg text-center">
                      <p className="text-sm text-yellow-600">N/A</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {checkItems.filter(item => item.result === 'na').length}
                      </p>
                    </div>
                  </div>

                  {/* Overall Results */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Overall Results</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Overall Status</span>
                        <span className="font-medium capitalize">{qualityCheck.status}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Overall Result</span>
                        <span className="font-medium capitalize">{qualityCheck.overallResult || 'Pending'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Completion Rate</span>
                        <span className="font-medium">
                          {checkItems.length > 0 
                            ? Math.round((checkItems.filter(item => item.result !== 'na').length / checkItems.length) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Taken Summary */}
                  {checkItems.some(item => item.actionTaken) && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Actions Taken Summary</h4>
                      <div className="space-y-2">
                        {['accept', 'reject', 'return', 'replace', 'repair'].map(action => {
                          const count = checkItems.filter(item => item.actionTaken === action).length;
                          if (count === 0) return null;
                          
                          return (
                            <div key={action} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="capitalize">{action}</span>
                              <span className="font-medium">{count} items</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
