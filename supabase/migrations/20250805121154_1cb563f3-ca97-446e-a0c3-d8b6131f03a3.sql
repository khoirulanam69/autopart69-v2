-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'card')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction_items table
CREATE TABLE public.transaction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for transaction_items
CREATE POLICY "Users can view transaction items for their transactions" 
ON public.transaction_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.transactions 
  WHERE transactions.id = transaction_items.transaction_id 
  AND transactions.user_id = auth.uid()
));

CREATE POLICY "Users can create transaction items for their transactions" 
ON public.transaction_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.transactions 
  WHERE transactions.id = transaction_items.transaction_id 
  AND transactions.user_id = auth.uid()
));

CREATE POLICY "Users can update transaction items for their transactions" 
ON public.transaction_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.transactions 
  WHERE transactions.id = transaction_items.transaction_id 
  AND transactions.user_id = auth.uid()
));

CREATE POLICY "Users can delete transaction items for their transactions" 
ON public.transaction_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.transactions 
  WHERE transactions.id = transaction_items.transaction_id 
  AND transactions.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product_id ON public.transaction_items(product_id);