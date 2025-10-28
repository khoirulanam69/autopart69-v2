-- Add technician fee and other fees columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN technician_fee numeric DEFAULT 0 NOT NULL,
ADD COLUMN other_fees numeric DEFAULT 0 NOT NULL;