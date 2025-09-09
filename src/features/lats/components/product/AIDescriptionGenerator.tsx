import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Bot, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Copy,
  RefreshCw
} from 'lucide-react';
import { 
  generateProductDescription, 
  isAIDescriptionAvailable, 
  getEstimatedGenerationTime,
  type ProductInfo,
  type AIDescriptionResult 
} from '../../../../lib/aiDescriptionService';

interface AIDescriptionGeneratorProps {
  productName: string;
  productModel?: string;
  categoryName?: string;
  brandName?: string;
  currentDescription: string;
  onDescriptionGenerated: (description: string) => void;
  disabled?: boolean;
}

const AIDescriptionGenerator: React.FC<AIDescriptionGeneratorProps> = ({
  productName,
  productModel,
  categoryName,
  brandName,
  currentDescription,
  onDescriptionGenerated,
  disabled = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<AIDescriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerateDescription = async () => {
    if (!productName.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedResult(null);

    try {
      const productInfo: ProductInfo = {
        name: productName,
        model: productModel,
        category: categoryName,
        brand: brandName
      };

      const result = await generateProductDescription(productInfo);
      setGeneratedResult(result);
      setShowPreview(true);
    } catch (err) {
      setError('Failed to generate description. Please try again.');
      console.error('AI description generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseDescription = () => {
    if (generatedResult) {
      onDescriptionGenerated(generatedResult.description);
      setShowPreview(false);
    }
  };

  const handleCopyDescription = () => {
    if (generatedResult) {
      navigator.clipboard.writeText(generatedResult.description);
    }
  };

  const handleRegenerate = () => {
    setGeneratedResult(null);
    setShowPreview(false);
    handleGenerateDescription();
  };

  const isAvailable = isAIDescriptionAvailable();
  const estimatedTime = getEstimatedGenerationTime();

  if (!isAvailable) {
    return null; // Don't show if AI service is not available
  }

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerateDescription}
          disabled={disabled || isGenerating || !productName.trim()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            disabled || isGenerating || !productName.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Description</span>
            </>
          )}
        </button>

        {isGenerating && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Search className="w-4 h-4 animate-pulse" />
            <span>Searching web...</span>
            <span className="text-xs">(~{estimatedTime / 1000}s)</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Generated Result Preview */}
      {generatedResult && showPreview && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">AI Generated Description</h4>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {generatedResult.source}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyDescription}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Copy description"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Regenerate"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {generatedResult.description}
            </p>
          </div>

          {/* Model Identifier */}
          {generatedResult.modelIdentifier && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Model Identifier:</h5>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <code className="text-sm font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded">
                  {generatedResult.modelIdentifier}
                </code>
              </div>
            </div>
          )}

          {/* Technical Specifications */}
          {generatedResult.technicalSpecs && Object.keys(generatedResult.technicalSpecs).length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Technical Specifications:</h5>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2 text-xs">
                  {Object.entries(generatedResult.technicalSpecs).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start">
                      <span className="text-gray-600 capitalize font-medium min-w-[80px]">{key}:</span>
                      <span className="text-gray-900 text-right flex-1 ml-2">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Key Specifications */}
          {generatedResult.specifications && Object.keys(generatedResult.specifications).length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Key Specifications:</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(generatedResult.specifications).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key}:</span>
                    <span className="text-gray-900 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Preview */}
          {generatedResult.features && generatedResult.features.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Key Features:</h5>
              <div className="flex flex-wrap gap-1">
                {generatedResult.features.slice(0, 3).map((feature, index) => (
                  <span
                    key={index}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUseDescription}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Use This Description</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info Text */}
      <div className="text-xs text-gray-500 flex items-center gap-2">
        <Bot className="w-3 h-3" />
        <span>
          AI searches the web using product name and model to generate detailed specifications like Apple's website
        </span>
      </div>
    </div>
  );
};

export default AIDescriptionGenerator;
