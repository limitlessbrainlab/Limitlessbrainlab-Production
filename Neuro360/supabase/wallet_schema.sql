-- =====================================================
-- Wallet Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- ==================================================   ===
-- Payment Methods Table
-- =====================================================

CREATE TABLE IF NOT EXISTS wallet_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    method_type VARCHAR(20) NOT NULL, -- 'card', 'upi', 'wallet'
    -- Card fields
    card_type VARCHAR(20), -- 'visa', 'mastercard', 'rupay'
    last_four VARCHAR(4),
    expiry VARCHAR(10),
    cardholder_name VARCHAR(255),
    -- UPI fields
    upi_id VARCHAR(100),
    -- Common fields
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_methods_email ON wallet_payment_methods(patient_email);
CREATE INDEX IF NOT EXISTS idx_wallet_methods_type ON wallet_payment_methods(method_type);

-- Enable Row Level Security
ALTER TABLE wallet_payment_methods ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert wallet_payment_methods" ON wallet_payment_methods
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view wallet_payment_methods" ON wallet_payment_methods
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update wallet_payment_methods" ON wallet_payment_methods
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete wallet_payment_methods" ON wallet_payment_methods
    FOR DELETE USING (true);

-- =====================================================
-- Transactions Table (Purchase History)
-- =====================================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    transaction_date DATE DEFAULT CURRENT_DATE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Report', 'Course', 'Frequencies', 'Session', 'Device rental', 'Event'
    partner VARCHAR(100), -- 'NeuroSense', 'Dr. Shweta', 'Neuro360', 'Dr. Roland', 'Neurobics'
    status VARCHAR(20) DEFAULT 'Pending', -- 'Paid', 'Pending', 'Refunded', 'Failed'
    amount DECIMAL(10, 2) NOT NULL,
    invoice_id VARCHAR(50),
    payment_method_id UUID REFERENCES wallet_payment_methods(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_trans_email ON wallet_transactions(patient_email);
CREATE INDEX IF NOT EXISTS idx_wallet_trans_date ON wallet_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_trans_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_trans_category ON wallet_transactions(category);

-- Enable Row Level Security
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert wallet_transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view wallet_transactions" ON wallet_transactions
    FOR SELECT USING (true);

-- =====================================================
-- Subscriptions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS wallet_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL, -- 'Monthly', 'Quarterly', 'Annual', 'Lifetime'
    renewal_date DATE,
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Paused', 'Cancelled', 'Expired'
    amount DECIMAL(10, 2) NOT NULL,
    period VARCHAR(20) DEFAULT 'mo', -- 'mo', 'qtr', 'yr', 'one-time'
    icon VARCHAR(20) DEFAULT 'star', -- 'star', 'music', 'video', 'users'
    payment_method_id UUID REFERENCES wallet_payment_methods(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_subs_email ON wallet_subscriptions(patient_email);
CREATE INDEX IF NOT EXISTS idx_wallet_subs_status ON wallet_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_subs_renewal ON wallet_subscriptions(renewal_date);

-- Enable Row Level Security
ALTER TABLE wallet_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert wallet_subscriptions" ON wallet_subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view wallet_subscriptions" ON wallet_subscriptions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update wallet_subscriptions" ON wallet_subscriptions
    FOR UPDATE USING (true);

-- =====================================================
-- Credits & Session Packs Table
-- =====================================================

CREATE TABLE IF NOT EXISTS wallet_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL, -- 'Neurofeedback Sessions', 'Brain Coach Sessions', etc.
    credit_type VARCHAR(20) NOT NULL, -- 'session', 'credit', 'rupees'
    remaining INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_credits_email ON wallet_credits(patient_email);
CREATE INDEX IF NOT EXISTS idx_wallet_credits_type ON wallet_credits(credit_type);
CREATE INDEX IF NOT EXISTS idx_wallet_credits_expiry ON wallet_credits(expiry_date);

-- Enable Row Level Security
ALTER TABLE wallet_credits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert wallet_credits" ON wallet_credits
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view wallet_credits" ON wallet_credits
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update wallet_credits" ON wallet_credits
    FOR UPDATE USING (true);

-- =====================================================
-- Invoices Table
-- =====================================================

CREATE TABLE IF NOT EXISTS wallet_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Paid', 'Pending', 'Upcoming', 'Overdue'
    transaction_id UUID REFERENCES wallet_transactions(id),
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_invoices_email ON wallet_invoices(patient_email);
CREATE INDEX IF NOT EXISTS idx_wallet_invoices_number ON wallet_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_wallet_invoices_date ON wallet_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_invoices_status ON wallet_invoices(status);

-- Enable Row Level Security
ALTER TABLE wallet_invoices ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert wallet_invoices" ON wallet_invoices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view wallet_invoices" ON wallet_invoices
    FOR SELECT USING (true);

-- =====================================================
-- Function to update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_wallet_methods_updated_at ON wallet_payment_methods;
CREATE TRIGGER trigger_wallet_methods_updated_at
    BEFORE UPDATE ON wallet_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_updated_at();

DROP TRIGGER IF EXISTS trigger_wallet_subs_updated_at ON wallet_subscriptions;
CREATE TRIGGER trigger_wallet_subs_updated_at
    BEFORE UPDATE ON wallet_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_updated_at();

DROP TRIGGER IF EXISTS trigger_wallet_credits_updated_at ON wallet_credits;
CREATE TRIGGER trigger_wallet_credits_updated_at
    BEFORE UPDATE ON wallet_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_updated_at();

-- =====================================================
-- Function to generate invoice number
-- =====================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON wallet_invoices;
CREATE TRIGGER trigger_generate_invoice_number
    BEFORE INSERT ON wallet_invoices
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_number();

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all payment methods for a patient
-- SELECT * FROM wallet_payment_methods WHERE patient_email = 'patient@email.com' ORDER BY is_default DESC, created_at DESC;

-- Get transaction history with filters
-- SELECT * FROM wallet_transactions
-- WHERE patient_email = 'patient@email.com'
-- AND category = 'Session'
-- AND status = 'Paid'
-- ORDER BY transaction_date DESC;

-- Get total spent by patient
-- SELECT SUM(amount) as total_spent FROM wallet_transactions
-- WHERE patient_email = 'patient@email.com' AND status = 'Paid';

-- Get spending by category
-- SELECT category, COUNT(*) as count, SUM(amount) as total
-- FROM wallet_transactions
-- WHERE patient_email = 'patient@email.com' AND status = 'Paid'
-- GROUP BY category
-- ORDER BY total DESC;

-- Get active subscriptions
-- SELECT * FROM wallet_subscriptions
-- WHERE patient_email = 'patient@email.com' AND status = 'Active'
-- ORDER BY renewal_date ASC;

-- Get expiring credits/sessions (within 30 days)
-- SELECT * FROM wallet_credits
-- WHERE patient_email = 'patient@email.com'
-- AND expiry_date IS NOT NULL
-- AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
-- ORDER BY expiry_date ASC;

-- Get unpaid invoices
-- SELECT * FROM wallet_invoices
-- WHERE patient_email = 'patient@email.com'
-- AND status IN ('Pending', 'Upcoming', 'Overdue')
-- ORDER BY due_date ASC;

-- Monthly spending summary
-- SELECT
--   DATE_TRUNC('month', transaction_date) as month,
--   COUNT(*) as transactions,
--   SUM(amount) as total_spent
-- FROM wallet_transactions
-- WHERE patient_email = 'patient@email.com' AND status = 'Paid'
-- GROUP BY DATE_TRUNC('month', transaction_date)
-- ORDER BY month DESC;

