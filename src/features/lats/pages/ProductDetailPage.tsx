import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getLatsProvider } from '../lib/data/provider';
import type { Product, ProductVariant } from '../types/inventory';
import { ImageUploadService, type UploadedImage } from '../../../lib/imageUpload';
import GlassBadge from '../../../features/shared/components/ui/GlassBadge';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import LoadingSkeleton, { TextSkeleton } from '../../../features/shared/components/ui/LoadingSkeleton';
import ImageDisplay from '../../../features/shared/components/ui/ImageDisplay';
import EditProductModal from '../components/inventory/EditProductModal';
import { ArrowLeft, Package, Tag, Hash, DollarSign, TrendingUp, AlertTriangle, CheckCircle, XCircle, Image as ImageIcon, Edit } from 'lucide-react';
import { 
	calculateTotalStock, 
	calculateTotalCostValue, 
	calculateTotalRetailValue,
	calculatePotentialProfit,
	calculateProfitMargin,
	getStockStatus,
	formatCurrency,
	formatNumber
} from '../lib/productCalculations';

const ProductDetailPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [product, setProduct] = useState<Product | null>(null);
	const [images, setImages] = useState<UploadedImage[]>([]);
	const [showEditModal, setShowEditModal] = useState(false);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			if (!id) return;
			setIsLoading(true);
			setError(null);
			try {
				const provider = getLatsProvider();
				const { ok, data, message } = await provider.getProduct(id);
				if (!ok || !data) {
					throw new Error(message || 'Failed to load product');
				}
				const imgs = await ImageUploadService.getProductImages(id);
				if (!isMounted) return;
				setProduct(data as Product);
				setImages(imgs || []);
				
				// Debug logging for images
				console.log('🔍 ProductDetailPage: Images loaded:', {
					productId: id,
					imageCount: imgs?.length || 0,
					images: imgs?.map(img => ({
						id: img.id,
						url: img.url,
						thumbnailUrl: img.thumbnailUrl,
						fileName: img.fileName,
						isPrimary: img.isPrimary
					}))
				});
			} catch (e: any) {
				if (!isMounted) return;
				setError(e?.message || 'Something went wrong');
			} finally {
				if (isMounted) setIsLoading(false);
			}
		};
		load();
		return () => { isMounted = false; };
	}, [id]);

	const primaryImage = useMemo(() => {
		return images.find((i) => i.isPrimary) || images[0] || null;
	}, [images]);

	const variants: ProductVariant[] = useMemo(() => product?.variants || [], [product]);
	const variantsCount = variants.length;
	
	// Calculate total stock and value dynamically from variants using utility functions
	const totalQty = useMemo(() => calculateTotalStock(variants), [variants]);
	const totalValue = useMemo(() => calculateTotalCostValue(variants), [variants]);
	const retailValue = useMemo(() => calculateTotalRetailValue(variants), [variants]);
	const potentialProfit = useMemo(() => calculatePotentialProfit(variants), [variants]);
	const profitMargin = useMemo(() => calculateProfitMargin(variants), [variants]);
	const stockStatus = useMemo(() => getStockStatus(variants), [variants]);
	
	// Debug logging
	useEffect(() => {
		if (product) {
			console.log('🔍 ProductDetailPage Debug:', {
				productName: product.name,
				variantsCount: variants.length,
				totalQty,
				totalValue,
				retailValue,
				potentialProfit,
				profitMargin,
				stockStatus,
				variants: variants.map(v => ({
					name: v.name,
					quantity: v.quantity,
					quantityType: typeof v.quantity,
					costPrice: v.costPrice,
					costPriceType: typeof v.costPrice,
					sellingPrice: v.sellingPrice,
					sellingPriceType: typeof v.sellingPrice,
					minQuantity: v.minQuantity
				}))
			});
		}
	}, [product, variants, totalQty, totalValue, retailValue, potentialProfit, profitMargin, stockStatus]);

	// Helper function to format dimensions
	const formatDimensions = (dimensions?: { length?: number; width?: number; height?: number }) => {
		if (!dimensions) return '-';
		const parts = [dimensions.length, dimensions.width, dimensions.height].filter(part => part !== undefined);
		return parts.length > 0 ? `${parts.join(' x ')} cm` : '-';
	};

	if (isLoading) {
		return (
			<div className="p-6 space-y-4">
				<LoadingSkeleton variant="rectangular" height="2rem" width="40%" />
				<LoadingSkeleton variant="rectangular" height="16rem" width="100%" />
				<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
					<LoadingSkeleton variant="rounded" height="5rem" />
					<LoadingSkeleton variant="rounded" height="5rem" />
					<LoadingSkeleton variant="rounded" height="5rem" />
				</div>
				<TextSkeleton lines={3} />
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<div className="mb-4">
					<Link to="/lats/products" className="text-sm text-blue-600 hover:underline">← Back to products</Link>
				</div>
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
			</div>
		);
	}

	if (!product) return null;

	return (
		<>
			<div className="p-2 sm:p-4 max-w-6xl mx-auto w-full">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center">
						<Link to="/lats/products" className="mr-4 text-gray-700 hover:text-gray-900">
							<ArrowLeft size={20} />
						</Link>
						<h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
					</div>
					
					<div className="flex items-center gap-2">
						<button
							onClick={() => setShowEditModal(true)}
							className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
							aria-label="Edit product"
						>
							<Edit size={18} />
						</button>
					</div>
				</div>

			{/* Main Product Header */}
			<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<div className="flex flex-col lg:flex-row gap-6">
					{/* Product Image */}
					<div className="lg:w-1/3">
						<div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-50 border border-gray-200">
							{primaryImage ? (
								<ImageDisplay 
									imageUrl={primaryImage.url} 
									thumbnailUrl={primaryImage.thumbnailUrl} 
									alt={product.name} 
									className="h-full w-full object-contain" 
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-gray-400">
									<ImageIcon size={48} />
								</div>
							)}
						</div>
						
						{/* Image Thumbnails */}
						{images.length > 1 && (
							<div className="flex gap-2 mt-3 overflow-x-auto">
								{images.slice(0, 6).map((img) => (
									<button 
										key={img.id} 
										type="button" 
										className={`flex-shrink-0 w-16 h-16 overflow-hidden rounded border-2 ${
											primaryImage?.id === img.id ? 'border-blue-500' : 'border-gray-200'
										}`}
									>
										<ImageDisplay 
											imageUrl={img.url} 
											thumbnailUrl={img.thumbnailUrl} 
											alt={img.fileName} 
											className="h-full w-full object-cover" 
										/>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Product Info */}
					<div className="lg:w-2/3">
						<div className="flex items-start justify-between mb-4">
							<div>
								<h2 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h2>
							</div>
							<div className="flex items-center gap-2">
								{product.isActive ? (
									<GlassBadge size="sm" variant="success">Active</GlassBadge>
								) : (
									<GlassBadge size="sm" variant="default">Inactive</GlassBadge>
								)}
								{product.isFeatured && <GlassBadge size="sm" variant="warning">Featured</GlassBadge>}
								{product.isDigital && <GlassBadge size="sm" variant="info">Digital</GlassBadge>}
							</div>
						</div>

						{/* Key Stats */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
							<div className="text-center p-3 bg-blue-50 rounded-lg">
								<div className="text-2xl font-bold text-blue-900">{formatNumber(totalQty)}</div>
								<div className="text-sm text-blue-600">Total Stock</div>
								<div className="text-xs text-blue-500 mt-1">
									{stockStatus === 'out-of-stock' && 'Out of Stock'}
									{stockStatus === 'low' && 'Low Stock'}
									{stockStatus === 'normal' && 'In Stock'}
								</div>
							</div>
							<div className="text-center p-3 bg-green-50 rounded-lg">
								<div className="text-2xl font-bold text-green-900">{formatCurrency(totalValue)}</div>
								<div className="text-sm text-green-600">Cost Value</div>
								<div className="text-xs text-green-500 mt-1">
									{formatCurrency(potentialProfit)} profit
								</div>
							</div>
							<div className="text-center p-3 bg-purple-50 rounded-lg">
								<div className="text-2xl font-bold text-purple-900">{variantsCount}</div>
								<div className="text-sm text-purple-600">Variants</div>
								<div className="text-xs text-purple-500 mt-1">
									{profitMargin.toFixed(1)}% margin
								</div>
							</div>
							<div className="text-center p-3 bg-amber-50 rounded-lg">
								<div className="text-2xl font-bold text-amber-900">{formatCurrency(retailValue)}</div>
								<div className="text-sm text-amber-600">Retail Value</div>
								<div className="text-xs text-amber-500 mt-1">
									{formatCurrency(retailValue - totalValue)} markup
								</div>
							</div>
						</div>

						{/* Product Details Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-3">
								{product.sku && (
									<div className="flex items-center gap-3">
										<Hash size={16} className="text-gray-500" />
										<div>
											<div className="text-sm text-gray-500">SKU</div>
											<div className="font-mono text-gray-900">{product.sku}</div>
										</div>
									</div>
								)}
								{product.barcode && (
									<div className="flex items-center gap-3">
										<Tag size={16} className="text-gray-500" />
										<div>
											<div className="text-sm text-gray-500">Barcode</div>
											<div className="font-mono text-gray-900">{product.barcode}</div>
										</div>
									</div>
								)}
								{product.category?.name && (
									<div className="flex items-center gap-3">
										<Package size={16} className="text-gray-500" />
										<div>
											<div className="text-sm text-gray-500">Category</div>
											<div className="text-gray-900">{product.category.name}</div>
										</div>
									</div>
								)}
							</div>
							<div className="space-y-3">
								{product.brand?.name && (
									<div className="flex items-center gap-3">
										<TrendingUp size={16} className="text-gray-500" />
										<div>
											<div className="text-sm text-gray-500">Brand</div>
											<div className="text-gray-900">{product.brand.name}</div>
										</div>
									</div>
								)}
								{product.supplier?.name && (
									<div className="flex items-center gap-3">
										<DollarSign size={16} className="text-gray-500" />
										<div>
											<div className="text-sm text-gray-500">Supplier</div>
											<div className="text-gray-900">{product.supplier.name}</div>
										</div>
									</div>
								)}

							</div>
						</div>

						{/* Tags */}
						{product.tags && product.tags.length > 0 && (
							<div className="mt-4 pt-4 border-t border-gray-200">
								<div className="text-sm text-gray-500 mb-2">Tags</div>
								<div className="flex flex-wrap gap-2">
									{product.tags.map((t) => (
										<GlassBadge key={t} size="sm" variant="default">{t}</GlassBadge>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column - Main Content */}
				<div className="lg:col-span-2 space-y-6">
					{/* Description */}
					{product.description && (
						<div className="bg-white rounded-xl border border-gray-200 p-6">
							<h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
							<p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
						</div>
					)}



					{/* Variants */}
					<div className="bg-white rounded-xl border border-gray-200 p-6">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-100 rounded-lg">
									<Package className="w-5 h-5 text-blue-600" />
								</div>
								<div>
									<h3 className="text-xl font-bold text-gray-900">Product Variants</h3>
									<p className="text-sm text-gray-600">Manage different versions of this product</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<GlassBadge size="sm" variant="default">{variantsCount} total</GlassBadge>
								{variantsCount > 0 && (
									<div className="text-sm text-gray-500">
										{totalQty} units in stock
									</div>
								)}
							</div>
						</div>
						
						{variantsCount === 0 ? (
							<div className="text-center py-12">
								<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<Package className="w-8 h-8 text-gray-400" />
								</div>
								<h4 className="text-lg font-semibold text-gray-900 mb-2">No Variants Found</h4>
								<p className="text-gray-600 max-w-md mx-auto">
									This product doesn't have any variants yet. Variants allow you to offer different versions of the same product (e.g., different sizes, colors, or configurations).
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{/* Variants Summary */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
									<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-blue-100 rounded-lg">
												<Tag className="w-4 h-4 text-blue-600" />
											</div>
											<div>
												<div className="text-2xl font-bold text-blue-900">{variantsCount}</div>
												<div className="text-sm text-blue-600">Total Variants</div>
											</div>
										</div>
									</div>
									
									<div className="bg-green-50 rounded-lg p-4 border border-green-200">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-green-100 rounded-lg">
												<Package className="w-4 h-4 text-green-600" />
											</div>
											<div>
												<div className="text-2xl font-bold text-green-900">{totalQty}</div>
												<div className="text-sm text-green-600">Total Stock</div>
											</div>
										</div>
									</div>
									
									<div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-purple-100 rounded-lg">
												<DollarSign className="w-4 h-4 text-purple-600" />
											</div>
											<div>
												<div className="text-2xl font-bold text-purple-900">${product.totalValue?.toFixed(2) ?? '0.00'}</div>
												<div className="text-sm text-purple-600">Total Value</div>
											</div>
										</div>
									</div>
								</div>

								{/* Variants List */}
								<div className="space-y-4">
									{variants.map((variant, index) => (
										<div key={variant.id} className="group border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200">
											{/* Variant Header */}
											<div className="flex items-start justify-between mb-4">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-semibold text-blue-600">
														{index + 1}
													</div>
													<div>
														<h4 className="text-lg font-semibold text-gray-900">{variant.name}</h4>
														<div className="flex items-center gap-2 mt-1">
															<span className="text-sm text-gray-500 font-mono">{variant.sku}</span>
															{variant.barcode && (
																<>
																	<span className="text-gray-300">•</span>
																	<span className="text-sm text-gray-500 font-mono">{variant.barcode}</span>
																</>
															)}
														</div>
													</div>
												</div>
												
												{/* Stock Status Badge */}
												<div className={`px-3 py-1 rounded-full text-xs font-medium ${
													(variant.quantity ?? 0) <= 0 ? 'bg-red-100 text-red-700' :
													(variant.quantity ?? 0) <= 5 ? 'bg-orange-100 text-orange-700' : 
													'bg-green-100 text-green-700'
												}`}>
													{(variant.quantity ?? 0) <= 0 ? 'Out of Stock' :
													 (variant.quantity ?? 0) <= 5 ? 'Low Stock' : 'In Stock'}
												</div>
											</div>

											{/* Variant Details Grid */}
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
												{/* Pricing */}
												<div className="space-y-2">
													<div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pricing</div>
													<div className="space-y-1">
														<div className="flex justify-between text-sm">
															<span className="text-gray-600">Selling Price:</span>
															<span className="font-semibold text-green-700">${(variant as any).sellingPrice ?? (variant as any).price ?? 0}</span>
														</div>
														<div className="flex justify-between text-sm">
															<span className="text-gray-600">Cost Price:</span>
															<span className="font-semibold text-red-700">${variant.costPrice ?? 0}</span>
														</div>
														{variant.costPrice && (variant as any).sellingPrice && (
															<div className="flex justify-between text-sm">
																<span className="text-gray-600">Margin:</span>
																<span className="font-semibold text-blue-700">
																	{((((variant as any).sellingPrice - variant.costPrice) / (variant as any).sellingPrice) * 100).toFixed(1)}%
																</span>
															</div>
														)}
													</div>
												</div>

												{/* Stock */}
												<div className="space-y-2">
													<div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stock</div>
													<div className="space-y-1">
														<div className="flex justify-between text-sm">
															<span className="text-gray-600">Current:</span>
															<span className={`font-semibold ${
																(variant.quantity ?? 0) <= 0 ? 'text-red-700' :
																(variant.quantity ?? 0) <= 5 ? 'text-orange-700' : 
																'text-green-700'
															}`}>
																{variant.quantity ?? (variant as any).stockQuantity ?? 0}
															</span>
														</div>
														<div className="flex justify-between text-sm">
															<span className="text-gray-600">Min Level:</span>
															<span className="font-semibold text-gray-900">{(variant as any).minQuantity ?? (variant as any).minStockLevel ?? '-'}</span>
														</div>
														<div className="flex justify-between text-sm">
															<span className="text-gray-600">Max Level:</span>
															<span className="font-semibold text-gray-900">{(variant as any).maxQuantity ?? (variant as any).maxStockLevel ?? '-'}</span>
														</div>
													</div>
												</div>

												{/* Physical Properties */}
												<div className="space-y-2">
													<div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Properties</div>
													<div className="space-y-1">
														<div className="flex justify-between text-sm">
															<span className="text-gray-600">Weight:</span>
															<span className="font-semibold text-gray-900">{variant.weight ? `${variant.weight} kg` : '-'}</span>
														</div>
														<div className="flex justify-between text-sm">
															<span className="text-gray-600">Dimensions:</span>
															<span className="font-semibold text-gray-900">{formatDimensions(variant.dimensions)}</span>
														</div>
													</div>
												</div>

												{/* Status */}
												<div className="space-y-2">
													<div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</div>
													<div className="space-y-2">
														<div className="flex items-center gap-2">
															<div className={`w-2 h-2 rounded-full ${
																variant.isActive ? 'bg-green-500' : 'bg-gray-400'
															}`}></div>
															<span className="text-sm text-gray-900">
																{variant.isActive ? 'Active' : 'Inactive'}
															</span>
														</div>
														<div className="text-xs text-gray-500">
															Updated: {new Date(variant.updatedAt).toLocaleDateString()}
														</div>
													</div>
												</div>
											</div>

											{/* Attributes */}
											{variant.attributes && Object.keys(variant.attributes).length > 0 && (
												<div className="mt-4 pt-4 border-t border-gray-100">
													<div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Attributes</div>
													<div className="flex flex-wrap gap-2">
														{Object.entries(variant.attributes).map(([key, value]) => (
															<div key={key} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
																{key}: {String(value)}
															</div>
														))}
													</div>
												</div>
											)}

											{/* Stock Warning */}
											{(variant.quantity ?? 0) <= 5 && (variant.quantity ?? 0) > 0 && (
												<div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
													<div className="flex items-center gap-3">
														<AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
														<div>
															<div className="font-medium text-amber-900">Low Stock Warning</div>
															<div className="text-sm text-amber-700">
																Only {variant.quantity} units remaining. Consider restocking soon.
															</div>
														</div>
													</div>
												</div>
											)}

											{/* Out of Stock Warning */}
											{(variant.quantity ?? 0) <= 0 && (
												<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
													<div className="flex items-center gap-3">
														<XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
														<div>
															<div className="font-medium text-red-900">Out of Stock</div>
															<div className="text-sm text-red-700">
																This variant is currently out of stock and cannot be sold.
															</div>
														</div>
													</div>
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Right Column - Sidebar */}
				<div className="space-y-6">
					{/* Product Status */}
					<div className="bg-white rounded-xl border border-gray-200 p-6">
						<h3 className="text-lg font-bold text-gray-900 mb-4">Product Status</h3>
						<div className="space-y-3">
							<div className={`flex items-center gap-3 p-3 rounded-lg ${
								product.isActive ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
							}`}>
								{product.isActive ? (
									<CheckCircle size={16} className="text-green-600" />
								) : (
									<XCircle size={16} className="text-gray-400" />
								)}
								<span className="text-sm font-medium">Active Status</span>
							</div>
							
							<div className={`flex items-center gap-3 p-3 rounded-lg ${
								product.isFeatured ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'
							}`}>
								{product.isFeatured ? (
									<CheckCircle size={16} className="text-yellow-600" />
								) : (
									<XCircle size={16} className="text-gray-400" />
								)}
								<span className="text-sm font-medium">Featured</span>
							</div>
							
							<div className={`flex items-center gap-3 p-3 rounded-lg ${
								product.isDigital ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
							}`}>
								{product.isDigital ? (
									<CheckCircle size={16} className="text-blue-600" />
								) : (
									<XCircle size={16} className="text-gray-400" />
								)}
								<span className="text-sm font-medium">Digital Product</span>
							</div>
							
							<div className={`flex items-center gap-3 p-3 rounded-lg ${
								product.requiresShipping ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border border-gray-200'
							}`}>
								{product.requiresShipping ? (
									<CheckCircle size={16} className="text-orange-600" />
								) : (
									<XCircle size={16} className="text-gray-400" />
								)}
								<span className="text-sm font-medium">Shipping Required</span>
							</div>
						</div>
					</div>


				</div>
			</div>
		</div>

		{/* Edit Product Modal */}
		<EditProductModal
			isOpen={showEditModal}
			onClose={() => setShowEditModal(false)}
			productId={id || ''}
			onProductUpdated={(updatedProduct) => {
				setProduct(updatedProduct);
				setShowEditModal(false);
			}}
		/>
		</>
	);
};

export default ProductDetailPage;

