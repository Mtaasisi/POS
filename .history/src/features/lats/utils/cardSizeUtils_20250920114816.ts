import { RESPONSIVE_OPTIMIZATIONS } from '../../shared/constants/theme';

export interface CardSizeConfig {
  imageHeight: string;
  padding: string;
  textSize: {
    title: string;
    price: string;
    button: string;
    sku: string;
  };
  buttonSize: string;
}

export const getDynamicCardSize = (containerWidth: number, columns: number): CardSizeConfig => {
  const cardWidth = containerWidth / columns;
  
  // Ultra compact for very small cards (< 120px)
  if (cardWidth < 120) {
    return RESPONSIVE_OPTIMIZATIONS.dynamicCard.ultraCompact;
  }
  
  // Compact for small cards (120px - 160px)
  if (cardWidth < 160) {
    return RESPONSIVE_OPTIMIZATIONS.dynamicCard.compact;
  }
  
  // Standard for medium cards (160px+)
  return RESPONSIVE_OPTIMIZATIONS.dynamicCard.standard;
};

export const getResponsiveCardClasses = (containerWidth: number, columns: number) => {
  const cardSize = getDynamicCardSize(containerWidth, columns);
  
  return {
    imageHeight: cardSize.imageHeight,
    padding: cardSize.padding,
    textSize: cardSize.textSize,
    buttonSize: cardSize.buttonSize,
    // Additional responsive classes
    container: `grid grid-cols-${columns} gap-2`,
    card: `bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300`,
    title: `font-semibold text-gray-900 ${cardSize.textSize.title} mb-1 truncate`,
    price: `font-bold text-green-600 ${cardSize.textSize.price} truncate`,
    button: `w-full ${cardSize.buttonSize} bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${cardSize.textSize.button}`,
    sku: `${cardSize.textSize.sku} text-gray-500 mb-2`
  };
};

export const getOptimalColumns = (containerWidth: number, minCardWidth: number = 120): number => {
  const maxColumns = Math.floor(containerWidth / minCardWidth);
  return Math.max(1, Math.min(maxColumns, 6)); // Cap at 6 columns
};

export default {
  getDynamicCardSize,
  getResponsiveCardClasses,
  getOptimalColumns
};
