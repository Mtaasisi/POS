import React, { useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedTime: string;
  isDefault: boolean;
  enabled: boolean;
}

interface DeliveryMethodsManagerProps {
  methods: DeliveryMethod[];
  onMethodsChange: (methods: DeliveryMethod[]) => void;
}

const DeliveryMethodsManager: React.FC<DeliveryMethodsManagerProps> = ({
  methods,
  onMethodsChange
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMethod, setNewMethod] = useState<Omit<DeliveryMethod, 'id'>>({
    name: '',
    description: '',
    price: 0,
    estimatedTime: '',
    isDefault: false,
    enabled: true
  });

  const handleAddMethod = () => {
    if (!newMethod.name.trim() || !newMethod.description.trim() || newMethod.price < 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const method: DeliveryMethod = {
      ...newMethod,
      id: Date.now().toString()
    };

    // If this is the first method or marked as default, make it default
    if (methods.length === 0 || method.isDefault) {
      const updatedMethods = methods.map(m => ({ ...m, isDefault: false }));
      onMethodsChange([...updatedMethods, method]);
    } else {
      onMethodsChange([...methods, method]);
    }

    setNewMethod({
      name: '',
      description: '',
      price: 0,
      estimatedTime: '',
      isDefault: false,
      enabled: true
    });
    setIsAdding(false);
    toast.success('Delivery method added successfully');
  };

  const handleEditMethod = (id: string) => {
    const method = methods.find(m => m.id === id);
    if (method) {
      setNewMethod({ ...method });
      setEditingId(id);
    }
  };

  const handleSaveEdit = () => {
    if (!newMethod.name.trim() || !newMethod.description.trim() || newMethod.price < 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedMethods = methods.map(method =>
      method.id === editingId ? { ...newMethod, id: editingId } : method
    );

    // Handle default method logic
    if (newMethod.isDefault) {
      const finalMethods = updatedMethods.map(m => ({
        ...m,
        isDefault: m.id === editingId
      }));
      onMethodsChange(finalMethods);
    } else {
      onMethodsChange(updatedMethods);
    }

    setEditingId(null);
    setNewMethod({
      name: '',
      description: '',
      price: 0,
      estimatedTime: '',
      isDefault: false,
      enabled: true
    });
    toast.success('Delivery method updated successfully');
  };

  const handleDeleteMethod = (id: string) => {
    const method = methods.find(m => m.id === id);
    if (method?.isDefault) {
      toast.error('Cannot delete the default delivery method');
      return;
    }

    const updatedMethods = methods.filter(m => m.id !== id);
    onMethodsChange(updatedMethods);
    toast.success('Delivery method deleted successfully');
  };

  const handleToggleMethod = (id: string) => {
    const updatedMethods = methods.map(method =>
      method.id === id ? { ...method, enabled: !method.enabled } : method
    );
    onMethodsChange(updatedMethods);
  };

  const handleSetDefault = (id: string) => {
    const updatedMethods = methods.map(method => ({
      ...method,
      isDefault: method.id === id
    }));
    onMethodsChange(updatedMethods);
    toast.success('Default delivery method updated');
  };

  const renderMethodForm = (isEditing = false) => (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">
          {isEditing ? 'Edit Delivery Method' : 'Add New Delivery Method'}
        </h4>
        <button
          type="button"
          onClick={() => {
            setIsAdding(false);
            setEditingId(null);
            setNewMethod({
              name: '',
              description: '',
              price: 0,
              estimatedTime: '',
              isDefault: false,
              enabled: true
            });
          }}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Method Name (e.g., Standard Delivery)"
          value={newMethod.name}
          onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Description (e.g., 2-3 business days)"
          value={newMethod.description}
          onChange={(e) => setNewMethod({ ...newMethod, description: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="Price (TZS)"
          value={newMethod.price}
          onChange={(e) => setNewMethod({ ...newMethod, price: parseFloat(e.target.value) || 0 })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
        />
        <input
          type="text"
          placeholder="Estimated Time (e.g., 2-3 hours)"
          value={newMethod.estimatedTime}
          onChange={(e) => setNewMethod({ ...newMethod, estimatedTime: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex items-center gap-4 mt-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={newMethod.enabled}
            onChange={(e) => setNewMethod({ ...newMethod, enabled: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Enabled</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={newMethod.isDefault}
            onChange={(e) => setNewMethod({ ...newMethod, isDefault: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Set as Default</span>
        </label>
      </div>
      
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={isEditing ? handleSaveEdit : handleAddMethod}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isEditing ? 'Save Changes' : 'Add Method'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Delivery Methods</h3>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Method
          </button>
        )}
      </div>

      {isAdding && renderMethodForm(false)}
      {editingId && renderMethodForm(true)}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {methods.map((method) => (
          <div
            key={method.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              method.isDefault
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{method.name}</span>
              <div className="flex items-center gap-1">
                {method.isDefault && (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                )}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditMethod(method.id);
                    }}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMethod(method.id);
                    }}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">{method.description}</p>
            <p className="text-sm font-medium text-blue-600">
              TZS {method.price.toLocaleString()}
            </p>
            {!method.isDefault && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetDefault(method.id);
                }}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Set as Default
              </button>
            )}
          </div>
        ))}
      </div>

      {methods.length === 0 && !isAdding && (
        <div className="text-center py-8 text-gray-500">
          <p>No delivery methods configured</p>
          <p className="text-sm">Click "Add Method" to create your first delivery option</p>
        </div>
      )}
    </div>
  );
};

export default DeliveryMethodsManager;
