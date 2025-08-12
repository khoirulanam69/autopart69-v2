-- Remove minimum_stock column and add purchase_price to products table
ALTER TABLE public.products 
DROP COLUMN minimum_stock,
DROP COLUMN description,
ADD COLUMN purchase_price NUMERIC NOT NULL DEFAULT 0;