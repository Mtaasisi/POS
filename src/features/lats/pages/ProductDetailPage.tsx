import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
	Edit, 
	Trash2, 
	ArrowLeft, 
	Package, 
	Tag, 
	TrendingUp, 
	AlertTriangle,
	Plus,
	Minus,
	Eye,
	Download,
	Share2,
	Heart,
	Star,
	Clock,
	DollarSign,
	BarChart3,
	Users,
	ShoppingCart,
	Truck,
	CheckCircle,
	XCircle,
	Info,
	Settings,
	RefreshCw,
	Image as ImageIcon,
	Camera,
	Upload,
	X,
	Calendar,
	MapPin,
	Hash,
	Barcode,
	Bug
} from 'lucide-react';
import { format } from 'date-fns';
import { Product, ProductVariant, UploadedImage } from '../types/inventory';
import { getLatsProvider } from '../lib/data/provider';
import { ImageUploadService } from '../../../lib/imageUpload';
import { 
	calculateTotalStock, 
	calculateTotalCostValue, 
	calculateTotalRetailValue, 
	calculatePotentialProfit, 
	calculateProfitMargin, 
	getStockStatus 
} from '../lib/productCalculations';
import { generateProductPlaceholder, generateThumbnailPlaceholder, generateAvatarPlaceholder } from '../../../features/shared/components/ui/placeholderUtils';
import { processProductImages, cleanupImageData } from '../lib/imageUtils';
import { supabase } from '../../../lib/supabaseClient';
import GlassBadge from '../../../features/shared/components/ui/GlassBadge';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import LoadingSkeleton, { TextSkeleton } from '../../../features/shared/components/ui/LoadingSkeleton';
import ImageDisplay from '../../../features/shared/components/ui/ImageDisplay';
import EditProductModal from '../components/inventory/EditProductModal';

const ProductDetailPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [product, setProduct] = useState<Product | null>(null);
	const [images, setImages] = useState<UploadedImage[]>([]);
	const [showEditModal, setShowEditModal] = useState(false);
	const [debugInfo, setDebugInfo] = useState<any>(null);
	const [showDebug, setShowDebug] = useState(false);

	// Function to refresh product data and images
	const refreshProductData = async () => {
		if (!id) return;
		try {
			console.log('🔄 Refreshing product data for ID:', id);
			const provider = getLatsProvider();
			const { ok, data, message } = await provider.getProduct(id);
			if (ok && data) {
				setProduct(data as Product);
				const refreshedImages = await ImageUploadService.getProductImages(id);
				// Process images to prevent header size issues
				const processedImages = processProductImages(refreshedImages || []);
				setImages(processedImages);
				console.log('🔄 ProductDetailPage: Data refreshed successfully', data);
			} else {
				console.error('❌ Failed to refresh product data:', message);
				toast.error(`Failed to refresh: ${message}`);
			}
		} catch (error) {
			console.error('❌ Failed to refresh product data:', error);
			toast.error('Failed to refresh product data');
		}
	};

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			if (!id) return;
			setIsLoading(true);
			setError(null);
			
			try {
				console.log('🔍 Loading product with ID:', id);
				const provider = getLatsProvider();
				const productResult = await provider.getProduct(id);
				
				if (!productResult.ok || !productResult.data) {
					throw new Error(productResult.message || 'Failed to load product');
				}
				
				if (!isMounted) return;
				
				const productData = productResult.data as Product;
				console.log('📦 Product data loaded:', {
					id: productData.id,
					name: productData.name,
					variantsCount: productData.variants?.length || 0,
					totalQuantity: productData.totalQuantity,
					category: productData.category?.name,
					brand: productData.brand?.name,
					supplier: productData.supplier?.name
				});
				
				setProduct(productData);
				setDebugInfo({
					loadTime: Date.now(),
					productId: id,
					hasVariants: productData.variants && productData.variants.length > 0,
					variantsCount: productData.variants?.length || 0,
					hasCategory: !!productData.category,
					hasBrand: !!productData.brand,
					hasSupplier: !!productData.supplier,
					totalQuantity: productData.totalQuantity,
					totalValue: productData.totalValue
				});
				
				// Load images with error handling
				try {
					const imagesResult = await ImageUploadService.getProductImages(id);
					if (isMounted) {
						const processedImages = processProductImages(imagesResult || []);
						setImages(processedImages);
						console.log('📸 Images loaded:', processedImages.length);
					}
				} catch (imageError) {
					console.error('❌ Failed to load images:', imageError);
					if (isMounted) {
						setImages([]);
					}
				}
			} catch (e: any) {
				if (!isMounted) return;
				console.error('❌ Error loading product:', e);
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

	// Calculate additional product metrics
	const productMetrics = useMemo(() => {
		if (!product) return null;
		
		const totalStock = calculateTotalStock(product.variants || []);
		const totalCostValue = calculateTotalCostValue(product.variants || []);
		const totalRetailValue = calculateTotalRetailValue(product.variants || []);
		const potentialProfit = calculatePotentialProfit(product.variants || []);
		const profitMargin = calculateProfitMargin(product.variants || []);
		const stockStatus = getStockStatus(product.variants || []);
		
		return {
			totalStock,
			totalCostValue,
			totalRetailValue,
			potentialProfit,
			profitMargin,
			stockStatus
		};
	}, [product]);

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

	// Debug panel component
	const DebugPanel = () => (
		<div className="fixed top-4 right-4 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto text-xs">
			<div className="flex items-center justify-between mb-2">
				<h3 className="font-bold">🔍 Product Debug Info</h3>
				<button onClick={() => setShowDebug(false)} className="text-white hover:text-red-400">
					<X className="w-4 h-4" />
				</button>
			</div>
			<pre className="whitespace-pre-wrap">
				{JSON.stringify(debugInfo, null, 2)}
			</pre>
		</div>
	);

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
							onClick={() => setShowDebug(!showDebug)}
							className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
							aria-label="Debug info"
						>
							<Bug size={18} />
						</button>
						<button
							onClick={() => setShowEditModal(true)}
							className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
							aria-label="Edit product"
						>
							<Edit size={18} />
						</button>
						<button
							onClick={refreshProductData}
							className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
							aria-label="Refresh product data"
						>
							<RefreshCw size={18} />
						</button>
					</div>
				</div>

				{/* Debug Information */}
				{debugInfo && (
					<div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
						<div className="font-medium mb-2">Debug Info:</div>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
							<div>ID: {debugInfo.productId}</div>
							<div>Variants: {debugInfo.variantsCount}</div>
							<div>Stock: {debugInfo.totalQuantity}</div>
							<div>Value: ${debugInfo.totalValue?.toFixed(2) || '0'}</div>
						</div>
					</div>
				)}

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
						</div>

						{/* Product Info */}
						<div className="lg:w-2/3">
							<h2 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h2>
							<p className="text-gray-600 mb-4">{product.description}</p>
							
							{/* Basic Info Grid */}
							<div className="grid grid-cols-2 gap-4 mb-4">
								<div>
									<span className="text-sm text-gray-500">Category</span>
									<p className="font-medium">{product.category?.name || 'N/A'}</p>
								</div>
								<div>
									<span className="text-sm text-gray-500">Brand</span>
									<p className="font-medium">{product.brand?.name || 'N/A'}</p>
								</div>
								<div>
									<span className="text-sm text-gray-500">Supplier</span>
									<p className="font-medium">{product.supplier?.name || 'N/A'}</p>
								</div>
								<div>
									<span className="text-sm text-gray-500">Condition</span>
									<p className="font-medium capitalize">{product.condition || 'N/A'}</p>
								</div>
							</div>

							{/* Product Metrics */}
							{productMetrics && (
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
									<div className="text-center p-3 bg-blue-50 rounded-lg">
										<div className="text-2xl font-bold text-blue-600">{productMetrics.totalStock}</div>
										<div className="text-xs text-gray-600">Total Stock</div>
									</div>
									<div className="text-center p-3 bg-green-50 rounded-lg">
										<div className="text-2xl font-bold text-green-600">${productMetrics.totalRetailValue.toFixed(2)}</div>
										<div className="text-xs text-gray-600">Retail Value</div>
									</div>
									<div className="text-center p-3 bg-orange-50 rounded-lg">
										<div className="text-2xl font-bold text-orange-600">${productMetrics.potentialProfit.toFixed(2)}</div>
										<div className="text-xs text-gray-600">Potential Profit</div>
									</div>
									<div className="text-center p-3 bg-purple-50 rounded-lg">
										<div className="text-2xl font-bold text-purple-600">{productMetrics.profitMargin.toFixed(1)}%</div>
										<div className="text-xs text-gray-600">Profit Margin</div>
									</div>
								</div>
							)}

							{/* Product Details */}
							<div className="space-y-3">
								{product.shortDescription && (
									<div className="flex items-start gap-2">
										<Info size={16} className="text-gray-400 mt-0.5" />
										<div>
											<span className="text-sm text-gray-500">Short Description</span>
											<p className="text-sm">{product.shortDescription}</p>
										</div>
									</div>
								)}
								
								{product.storeShelf && (
									<div className="flex items-start gap-2">
										<MapPin size={16} className="text-gray-400 mt-0.5" />
										<div>
											<span className="text-sm text-gray-500">Store Shelf</span>
											<p className="text-sm">{product.storeShelf}</p>
										</div>
									</div>
								)}

								{product.debutDate && (
									<div className="flex items-start gap-2">
										<Calendar size={16} className="text-gray-400 mt-0.5" />
										<div>
											<span className="text-sm text-gray-500">Debut Date</span>
											<p className="text-sm">{format(new Date(product.debutDate), 'PPP')}</p>
										</div>
									</div>
								)}

								{product.debutNotes && (
									<div className="flex items-start gap-2">
										<Info size={16} className="text-gray-400 mt-0.5" />
										<div>
											<span className="text-sm text-gray-500">Debut Notes</span>
											<p className="text-sm">{product.debutNotes}</p>
										</div>
									</div>
								)}

								{product.debutFeatures && product.debutFeatures.length > 0 && (
									<div className="flex items-start gap-2">
										<Star size={16} className="text-gray-400 mt-0.5" />
										<div>
											<span className="text-sm text-gray-500">Debut Features</span>
											<div className="flex flex-wrap gap-1 mt-1">
												{product.debutFeatures.map((feature, index) => (
													<span key={index} className="px-2 py-1 bg-yellow-100 text-xs rounded-full">
														{feature}
													</span>
												))}
											</div>
										</div>
									</div>
								)}



								{/* Product Flags */}
								<div className="flex items-start gap-2">
									<Settings size={16} className="text-gray-400 mt-0.5" />
									<div>
										<span className="text-sm text-gray-500">Product Flags</span>
										<div className="flex flex-wrap gap-1 mt-1">
											{product.isFeatured && (
												<span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
													Featured
												</span>
											)}
											{product.isDigital && (
												<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
													Digital
												</span>
											)}
											{product.requiresShipping && (
												<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
													Shipping Required
												</span>
											)}
											{product.taxRate > 0 && (
												<span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
													Tax: {(product.taxRate * 100).toFixed(1)}%
												</span>
											)}
										</div>
									</div>
								</div>

								{/* Metadata */}
								{product.metadata && Object.keys(product.metadata).length > 0 && (
									<div className="flex items-start gap-2">
										<BarChart3 size={16} className="text-gray-400 mt-0.5" />
										<div>
											<span className="text-sm text-gray-500">Metadata</span>
											<div className="mt-1 text-xs bg-gray-50 p-2 rounded">
												<pre className="whitespace-pre-wrap text-gray-700">
													{JSON.stringify(product.metadata, null, 2)}
												</pre>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Product Variants Section */}
				{product.variants && product.variants.length > 0 && (
					<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
						<h3 className="text-xl font-semibold mb-4">Product Variants</h3>
						<div className="grid gap-4">
							{product.variants.map((variant) => (
								<div key={variant.id} className="border border-gray-200 rounded-lg p-4">
									<div className="flex justify-between items-start mb-2">
										<div>
											<h4 className="font-medium">{variant.name}</h4>
											{variant.sku && (
												<div className="flex items-center gap-1 text-sm text-gray-600">
													<Hash size={12} />
													{variant.sku}
												</div>
											)}
											{variant.barcode && (
												<div className="flex items-center gap-1 text-sm text-gray-600">
													<Barcode size={12} />
													{variant.barcode}
												</div>
											)}
										</div>
										<div className="text-right">
											<div className="text-lg font-bold text-green-600">
												${variant.sellingPrice.toFixed(2)}
											</div>
											<div className="text-sm text-gray-500">
												Cost: ${variant.costPrice.toFixed(2)}
											</div>
										</div>
									</div>
									<div className="grid grid-cols-3 gap-4 text-sm">
										<div>
											<span className="text-gray-500">Stock:</span>
											<div className="font-medium">{variant.quantity}</div>
										</div>
										<div>
											<span className="text-gray-500">Min Stock:</span>
											<div className="font-medium">{variant.minQuantity}</div>
										</div>
										{variant.maxQuantity && (
											<div>
												<span className="text-gray-500">Max Stock:</span>
												<div className="font-medium">{variant.maxQuantity}</div>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Additional Information */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Category Information */}
					{product.category && (
						<GlassCard className="p-4">
							<h3 className="font-semibold mb-2">Category Information</h3>
							<div className="space-y-2 text-sm">
								<div>
									<span className="text-gray-500">Name:</span>
									<div className="font-medium">{product.category.name}</div>
								</div>
								{product.category.description && (
									<div>
										<span className="text-gray-500">Description:</span>
										<div className="font-medium">{product.category.description}</div>
									</div>
								)}
								{product.category.color && (
									<div>
										<span className="text-gray-500">Color:</span>
										<div className="flex items-center gap-2">
											<div 
												className="w-4 h-4 rounded-full border border-gray-300"
												style={{ backgroundColor: product.category.color }}
											></div>
											<span className="font-medium">{product.category.color}</span>
										</div>
									</div>
								)}
							</div>
						</GlassCard>
					)}

					{/* Brand Information */}
					{product.brand && (
						<GlassCard className="p-4">
							<h3 className="font-semibold mb-2">Brand Information</h3>
							<div className="space-y-2 text-sm">
								<div>
									<span className="text-gray-500">Name:</span>
									<div className="font-medium">{product.brand.name}</div>
								</div>
								{product.brand.description && (
									<div>
										<span className="text-gray-500">Description:</span>
										<div className="font-medium">{product.brand.description}</div>
									</div>
								)}
								{product.brand.website && (
									<div>
										<span className="text-gray-500">Website:</span>
										<div className="font-medium">
											<a 
												href={product.brand.website} 
												target="_blank" 
												rel="noopener noreferrer"
												className="text-blue-600 hover:underline"
											>
												{product.brand.website}
											</a>
										</div>
									</div>
								)}
							</div>
						</GlassCard>
					)}
				</div>

				{/* Supplier Information */}
				{product.supplier && (
					<div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
						<h3 className="text-xl font-semibold mb-4">Supplier Information</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<span className="text-sm text-gray-500">Name</span>
								<p className="font-medium">{product.supplier.name}</p>
							</div>
							{product.supplier.contactPerson && (
								<div>
									<span className="text-sm text-gray-500">Contact Person</span>
									<p className="font-medium">{product.supplier.contactPerson}</p>
								</div>
							)}
							{product.supplier.email && (
								<div>
									<span className="text-sm text-gray-500">Email</span>
									<p className="font-medium">{product.supplier.email}</p>
								</div>
							)}
							{product.supplier.phone && (
								<div>
									<span className="text-sm text-gray-500">Phone</span>
									<p className="font-medium">{product.supplier.phone}</p>
								</div>
							)}
							{product.supplier.address && (
								<div className="md:col-span-2">
									<span className="text-sm text-gray-500">Address</span>
									<p className="font-medium">{product.supplier.address}</p>
								</div>
							)}
							{product.supplier.website && (
								<div className="md:col-span-2">
									<span className="text-sm text-gray-500">Website</span>
									<p className="font-medium">
										<a 
											href={product.supplier.website} 
											target="_blank" 
											rel="noopener noreferrer"
											className="text-blue-600 hover:underline"
										>
											{product.supplier.website}
										</a>
									</p>
								</div>
							)}
							{product.supplier.notes && (
								<div className="md:col-span-2">
									<span className="text-sm text-gray-500">Notes</span>
									<p className="font-medium">{product.supplier.notes}</p>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Edit Product Modal */}
			<EditProductModal
				isOpen={showEditModal}
				onClose={() => setShowEditModal(false)}
				productId={id || ''}
				onProductUpdated={async (updatedProduct) => {
					setProduct(updatedProduct);
					if (id) {
						try {
							const refreshedImages = await ImageUploadService.getProductImages(id);
							setImages(refreshedImages || []);
						} catch (error) {
							console.error('❌ Failed to refresh images after update:', error);
						}
					}
					setShowEditModal(false);
				}}
			/>

			{/* Debug Panel */}
			{showDebug && <DebugPanel />}
		</>
	);
};

export default ProductDetailPage;

