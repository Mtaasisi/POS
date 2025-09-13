import React from 'react';
import { User, Phone, Mail, MapPin, Building, ExternalLink, X } from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';

interface SupplierInfoCardProps {
  supplierId: string;
  onRemove?: () => void;
  className?: string;
}

const SupplierInfoCard: React.FC<SupplierInfoCardProps> = ({
  supplierId,
  onRemove,
  className = ""
}) => {
  const { suppliers } = useInventoryStore();
  
  const supplier = suppliers.find(s => s.id === supplierId);
  
  if (!supplier) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-blue-900 truncate">{supplier.name}</h3>
              {supplier.website && (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Visit website"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            
            <div className="space-y-1 text-sm">
              {supplier.contact_person && (
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{supplier.contact_person}</span>
                </div>
              )}
              
              {supplier.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a 
                    href={`tel:${supplier.phone}`}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {supplier.phone}
                  </a>
                </div>
              )}
              
              {supplier.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a 
                    href={`mailto:${supplier.email}`}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {supplier.email}
                  </a>
                </div>
              )}
              
              {supplier.address && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="truncate">{supplier.address}</span>
                </div>
              )}
            </div>
            
            {supplier.notes && (
              <div className="mt-3 p-2 bg-white rounded border border-blue-100">
                <p className="text-xs text-gray-600">{supplier.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove supplier"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SupplierInfoCard;
