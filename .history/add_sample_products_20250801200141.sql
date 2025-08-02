-- Add Sample Products for Inventory Testing
-- Run this in your Supabase SQL Editor

-- Insert sample products
INSERT INTO products (name, description, brand, model, category_id, supplier_id, product_code, barcode, minimum_stock_level, maximum_stock_level, reorder_point, tags, specifications, warranty_period_months, is_active) VALUES
('iPhone 15 Pro Max', 'Latest iPhone with advanced camera system', 'Apple', 'iPhone 15 Pro Max', 'phones', 'supplier1', 'IPH15PM', '1234567890123', 5, 50, 10, ARRAY['smartphone', 'premium'], '{"storage": "256GB", "color": "Titanium", "camera": "48MP"}', 12, true),
('Samsung Galaxy S24 Ultra', 'Flagship Android smartphone', 'Samsung', 'Galaxy S24 Ultra', 'phones', 'supplier2', 'SGS24U', '1234567890124', 3, 30, 8, ARRAY['smartphone', 'android'], '{"storage": "512GB", "color": "Titanium Gray", "camera": "200MP"}', 12, true),
('MacBook Pro 16"', 'Professional laptop for developers', 'Apple', 'MacBook Pro 16"', 'laptops', 'supplier1', 'MBP16', '1234567890125', 2, 20, 5, ARRAY['laptop', 'professional'], '{"processor": "M3 Pro", "ram": "32GB", "storage": "1TB"}', 24, true),
('Dell XPS 15', 'Premium Windows laptop', 'Dell', 'XPS 15', 'laptops', 'supplier3', 'DXP15', '1234567890126', 4, 25, 7, ARRAY['laptop', 'windows'], '{"processor": "Intel i9", "ram": "32GB", "storage": "1TB"}', 24, true),
('AirPods Pro', 'Wireless noise-cancelling earbuds', 'Apple', 'AirPods Pro', 'accessories', 'supplier1', 'APP', '1234567890127', 10, 100, 20, ARRAY['earbuds', 'wireless'], '{"connectivity": "Bluetooth 5.0", "battery": "6 hours"}', 12, true),
('Samsung Galaxy Buds2 Pro', 'Premium wireless earbuds', 'Samsung', 'Galaxy Buds2 Pro', 'accessories', 'supplier2', 'SGB2P', '1234567890128', 8, 80, 15, ARRAY['earbuds', 'android'], '{"connectivity": "Bluetooth 5.2", "battery": "5 hours"}', 12, true),
('iPad Pro 12.9"', 'Professional tablet', 'Apple', 'iPad Pro 12.9"', 'tablets', 'supplier1', 'IPP12', '1234567890129', 3, 25, 8, ARRAY['tablet', 'professional'], '{"processor": "M2", "storage": "256GB", "display": "12.9-inch"}', 24, true),
('Samsung Galaxy Tab S9 Ultra', 'Large Android tablet', 'Samsung', 'Galaxy Tab S9 Ultra', 'tablets', 'supplier2', 'SGTS9U', '1234567890130', 2, 15, 5, ARRAY['tablet', 'android'], '{"processor": "Snapdragon 8 Gen 2", "storage": "512GB", "display": "14.6-inch"}', 24, true)
ON CONFLICT (product_code) DO NOTHING;

-- Insert sample product variants
INSERT INTO product_variants (product_id, sku, variant_name, attributes, cost_price, selling_price, quantity_in_stock, weight_kg, dimensions_cm, is_active) VALUES
-- iPhone 15 Pro Max variants
((SELECT id FROM products WHERE product_code = 'IPH15PM'), 'IPH15PM-256-BLACK', '256GB Titanium Black', '{"storage": "256GB", "color": "Titanium Black"}', 999.00, 1199.00, 15, 0.221, '159.3 x 77.6 x 8.25', true),
((SELECT id FROM products WHERE product_code = 'IPH15PM'), 'IPH15PM-512-BLACK', '512GB Titanium Black', '{"storage": "512GB", "color": "Titanium Black"}', 1199.00, 1399.00, 8, 0.221, '159.3 x 77.6 x 8.25', true),
((SELECT id FROM products WHERE product_code = 'IPH15PM'), 'IPH15PM-1TB-BLACK', '1TB Titanium Black', '{"storage": "1TB", "color": "Titanium Black"}', 1399.00, 1599.00, 3, 0.221, '159.3 x 77.6 x 8.25', true),

-- Samsung Galaxy S24 Ultra variants
((SELECT id FROM products WHERE product_code = 'SGS24U'), 'SGS24U-256-GRAY', '256GB Titanium Gray', '{"storage": "256GB", "color": "Titanium Gray"}', 1099.00, 1299.00, 12, 0.233, '163.4 x 79.0 x 8.6', true),
((SELECT id FROM products WHERE product_code = 'SGS24U'), 'SGS24U-512-GRAY', '512GB Titanium Gray', '{"storage": "512GB", "color": "Titanium Gray"}', 1299.00, 1499.00, 6, 0.233, '163.4 x 79.0 x 8.6', true),

-- MacBook Pro variants
((SELECT id FROM products WHERE product_code = 'MBP16'), 'MBP16-32-1TB', '32GB RAM 1TB SSD', '{"ram": "32GB", "storage": "1TB", "processor": "M3 Pro"}', 2499.00, 2999.00, 5, 2.15, '35.57 x 24.81 x 1.68', true),
((SELECT id FROM products WHERE product_code = 'MBP16'), 'MBP16-64-2TB', '64GB RAM 2TB SSD', '{"ram": "64GB", "storage": "2TB", "processor": "M3 Max"}', 3499.00, 3999.00, 2, 2.15, '35.57 x 24.81 x 1.68', true),

-- Dell XPS variants
((SELECT id FROM products WHERE product_code = 'DXP15'), 'DXP15-32-1TB', '32GB RAM 1TB SSD', '{"ram": "32GB", "storage": "1TB", "processor": "Intel i9"}', 1999.00, 2499.00, 8, 2.18, '35.78 x 23.85 x 1.85', true),

-- AirPods Pro variants
((SELECT id FROM products WHERE product_code = 'APP'), 'APP-BLACK', 'Black', '{"color": "Black"}', 199.00, 249.00, 25, 0.045, '30.9 x 18.0 x 19.5', true),
((SELECT id FROM products WHERE product_code = 'APP'), 'APP-WHITE', 'White', '{"color": "White"}', 199.00, 249.00, 30, 0.045, '30.9 x 18.0 x 19.5', true),

-- Samsung Galaxy Buds2 Pro variants
((SELECT id FROM products WHERE product_code = 'SGB2P'), 'SGB2P-BLACK', 'Black', '{"color": "Black"}', 179.00, 229.00, 20, 0.050, '17.1 x 20.9 x 21.1', true),
((SELECT id FROM products WHERE product_code = 'SGB2P'), 'SGB2P-WHITE', 'White', '{"color": "White"}', 179.00, 229.00, 18, 0.050, '17.1 x 20.9 x 21.1', true),

-- iPad Pro variants
((SELECT id FROM products WHERE product_code = 'IPP12'), 'IPP12-256-SILVER', '256GB Silver', '{"storage": "256GB", "color": "Silver"}', 999.00, 1199.00, 10, 0.685, '280.6 x 214.9 x 5.9', true),
((SELECT id FROM products WHERE product_code = 'IPP12'), 'IPP12-512-SILVER', '512GB Silver', '{"storage": "512GB", "color": "Silver"}', 1199.00, 1399.00, 5, 0.685, '280.6 x 214.9 x 5.9', true),

-- Samsung Galaxy Tab S9 Ultra variants
((SELECT id FROM products WHERE product_code = 'SGTS9U'), 'SGTS9U-512-BLACK', '512GB Black', '{"storage": "512GB", "color": "Black"}', 899.00, 1099.00, 7, 0.732, '326.4 x 208.6 x 5.5', true)
ON CONFLICT (sku) DO NOTHING;

-- Success message
SELECT 'Sample products and variants added successfully!' as status; 