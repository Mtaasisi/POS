import React, { useState } from 'react';
import { Calendar, Rocket, Clock, Award, Plus, X } from 'lucide-react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import GlassBadge from '../../../../features/shared/components/ui/GlassBadge';

interface DebutInformationFormProps {
  debutDate?: string;
  debutNotes?: string;
  debutFeatures?: string[];
  onDebutDateChange: (date: string) => void;
  onDebutNotesChange: (notes: string) => void;
  onDebutFeaturesChange: (features: string[]) => void;
  className?: string;
}

const DebutInformationForm: React.FC<DebutInformationFormProps> = ({
  debutDate = '',
  debutNotes = '',
  debutFeatures = [],
  onDebutDateChange,
  onDebutNotesChange,
  onDebutFeaturesChange,
  className = ''
}) => {
  const [newFeature, setNewFeature] = useState('');

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      onDebutFeaturesChange([...debutFeatures, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = debutFeatures.filter((_, i) => i !== index);
    onDebutFeaturesChange(updatedFeatures);
  };

  const getDebutStatus = () => {
    if (!debutDate) return 'not-scheduled';
    const debutDateTime = new Date(debutDate);
    const now = new Date();
    return debutDateTime <= now ? 'launched' : 'coming-soon';
  };

  const getDaysUntilDebut = () => {
    if (!debutDate) return 0;
    const debutDateTime = new Date(debutDate);
    const now = new Date();
    const diffTime = debutDateTime.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const debutStatus = getDebutStatus();
  const daysUntilDebut = getDaysUntilDebut();

  return (
    <GlassCard className={className}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Rocket className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Product Debut Information</h3>
        </div>

        <div className="space-y-6">
          {/* Debut Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Debut Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={debutDate}
                onChange={(e) => onDebutDateChange(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg pl-12 bg-white/30 backdrop-blur-md focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                placeholder="Select debut date"
              />
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            </div>
          </div>

          {/* Debut Status Display */}
          {debutDate && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {debutStatus === 'launched' ? (
                  <Award className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-orange-600" />
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {debutStatus === 'launched' ? 'Launched' : 'Coming Soon'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(debutDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              {debutStatus === 'coming-soon' && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{daysUntilDebut}</div>
                  <div className="text-sm text-gray-600">days until debut</div>
                </div>
              )}
            </div>
          )}

          {/* Debut Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Debut Notes
            </label>
            <textarea
              value={debutNotes}
              onChange={(e) => onDebutNotesChange(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 resize-none"
              placeholder="Add notes about the product debut..."
              rows={3}
            />
          </div>

          {/* Debut Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Debut Features
            </label>
            <div className="space-y-3">
              {/* Add new feature */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  placeholder="Add a debut feature..."
                />
                <GlassButton
                  variant="primary"
                  onClick={handleAddFeature}
                  disabled={!newFeature.trim()}
                  className="px-4"
                >
                  <Plus className="w-4 h-4" />
                </GlassButton>
              </div>

              {/* Features list */}
              {debutFeatures.length > 0 && (
                <div className="space-y-2">
                  {debutFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <span className="flex-1 text-gray-900">{feature}</span>
                      <button
                        onClick={() => handleRemoveFeature(index)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <GlassButton
              variant="outline"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                onDebutDateChange(today);
              }}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Set to Today
            </GlassButton>
            <GlassButton
              variant="outline"
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                onDebutDateChange(nextWeek.toISOString().split('T')[0]);
              }}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Next Week
            </GlassButton>
            <GlassButton
              variant="outline"
              onClick={() => {
                onDebutDateChange('');
                onDebutNotesChange('');
                onDebutFeaturesChange([]);
              }}
              className="flex items-center gap-2 text-red-600"
            >
              <X className="w-4 h-4" />
              Clear All
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default DebutInformationForm;
