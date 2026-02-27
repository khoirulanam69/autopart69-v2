-- Add indexes for better query performance on products table
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_products_created_at IS 'Index for sorting products by creation date';
COMMENT ON INDEX idx_products_category IS 'Index for filtering products by category';
COMMENT ON INDEX idx_products_stock IS 'Index for finding low/empty stock products';
COMMENT ON INDEX idx_products_name IS 'Index for searching products by name';
COMMENT ON INDEX idx_products_barcode IS 'Index for searching products by barcode';