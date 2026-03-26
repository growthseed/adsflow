-- =============================================
-- MIGRATION 014: E-COMMERCE DATA MODEL + CRM ENHANCEMENTS
-- Replaces hardcoded demo data with real tables, views, indexes, RLS
-- =============================================

-- =============================================
-- E-COMMERCE DATA MODEL (replaces demo data)
-- =============================================

-- Orders table
CREATE TABLE IF NOT EXISTS public.ecommerce_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  order_id TEXT NOT NULL, -- external order ID from platform
  platform TEXT, -- 'shopify', 'vtex', 'tray', 'woocommerce', 'manual'

  -- Customer
  customer_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  is_new_customer BOOLEAN DEFAULT true,

  -- Order details
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'shipped', 'delivered', 'cancelled', 'refunded'
  order_date TIMESTAMPTZ NOT NULL,
  approved_date TIMESTAMPTZ,
  shipped_date TIMESTAMPTZ,
  delivered_date TIMESTAMPTZ,

  -- Financial
  subtotal NUMERIC(12,2) DEFAULT 0,
  shipping_cost NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  coupon_code TEXT,
  payment_method TEXT,

  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,

  -- Location
  shipping_state TEXT,
  shipping_city TEXT,
  shipping_country TEXT DEFAULT 'BR',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, order_id)
);

-- Order items
CREATE TABLE IF NOT EXISTS public.ecommerce_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES ecommerce_orders(id) ON DELETE CASCADE,

  sku TEXT,
  product_name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products catalog (for ABC analysis)
CREATE TABLE IF NOT EXISTS public.ecommerce_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  unit_price NUMERIC(12,2) DEFAULT 0,
  cost_price NUMERIC(12,2), -- for margin calculation
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, sku)
);

-- Customers table (for RFM analysis)
CREATE TABLE IF NOT EXISTS public.ecommerce_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  customer_id TEXT NOT NULL, -- external ID
  name TEXT,
  email TEXT,
  phone TEXT,

  first_order_date TIMESTAMPTZ,
  last_order_date TIMESTAMPTZ,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  avg_order_value NUMERIC(12,2) DEFAULT 0,

  -- RFM scores (1-5)
  rfm_recency INTEGER,
  rfm_frequency INTEGER,
  rfm_monetary INTEGER,
  rfm_segment TEXT, -- 'champions', 'loyal', 'potential', 'at_risk', 'lost', 'new'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, customer_id)
);

-- =============================================
-- CRM ENHANCEMENTS
-- =============================================

-- Loss reasons enumeration (replaces free-text motivo_perda)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS motivo_perda_categoria TEXT
  CHECK (motivo_perda_categoria IN (
    'preco', 'concorrencia', 'timing', 'produto_inadequado',
    'sem_resposta', 'sem_orcamento', 'decisor_ausente',
    'escolheu_outro', 'desistiu', 'outro'
  ));

-- Win rate by source view
CREATE OR REPLACE VIEW public.vw_win_rate_by_source AS
SELECT
  client_id,
  fonte,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE resultado = 'vendido') AS wins,
  COUNT(*) FILTER (WHERE resultado = 'perdido') AS losses,
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE resultado = 'vendido')::numeric / COUNT(*)) * 100, 1)
    ELSE 0
  END AS win_rate,
  AVG(dias_ciclo) FILTER (WHERE resultado = 'vendido') AS avg_days_to_close,
  SUM(valor_fechado) FILTER (WHERE resultado = 'vendido') AS total_revenue
FROM leads
WHERE resultado IN ('vendido', 'perdido')
GROUP BY client_id, fonte;

-- Weighted pipeline forecast view
CREATE OR REPLACE VIEW public.vw_pipeline_forecast AS
SELECT
  o.client_id,
  o.status AS etapa,
  COUNT(*) AS deals,
  SUM(o.valor) AS face_value,
  AVG(o.probabilidade) AS avg_probability,
  SUM(o.valor * o.probabilidade / 100) AS weighted_value,
  AVG(o.dias_ciclo) AS avg_days_in_stage
FROM oportunidades o
WHERE o.resultado = 'aberta'
GROUP BY o.client_id, o.status;

-- =============================================
-- E-COMMERCE VIEWS
-- =============================================

-- Revenue summary
CREATE OR REPLACE VIEW public.vw_ecommerce_revenue AS
SELECT
  client_id,
  DATE_TRUNC('month', order_date) AS month,
  COUNT(*) AS orders,
  COUNT(*) FILTER (WHERE status != 'cancelled' AND status != 'refunded') AS approved_orders,
  SUM(total) FILTER (WHERE status != 'cancelled' AND status != 'refunded') AS revenue,
  AVG(total) FILTER (WHERE status != 'cancelled' AND status != 'refunded') AS avg_ticket,
  COUNT(DISTINCT customer_id) AS unique_customers,
  COUNT(*) FILTER (WHERE is_new_customer) AS new_customers,
  SUM(discount) AS total_discounts,
  COUNT(DISTINCT coupon_code) FILTER (WHERE coupon_code IS NOT NULL) AS coupons_used
FROM ecommerce_orders
GROUP BY client_id, DATE_TRUNC('month', order_date);

-- ABC curve (product pareto)
CREATE OR REPLACE VIEW public.vw_product_abc AS
WITH product_revenue AS (
  SELECT
    oi.product_name,
    oi.category,
    oi.sku,
    o.client_id,
    SUM(oi.total_price) AS total_revenue,
    SUM(oi.quantity) AS total_units
  FROM ecommerce_order_items oi
  JOIN ecommerce_orders o ON o.id = oi.order_id
  WHERE o.status != 'cancelled' AND o.status != 'refunded'
  GROUP BY oi.product_name, oi.category, oi.sku, o.client_id
),
ranked AS (
  SELECT *,
    SUM(total_revenue) OVER (PARTITION BY client_id ORDER BY total_revenue DESC) AS cumulative_revenue,
    SUM(total_revenue) OVER (PARTITION BY client_id) AS grand_total
  FROM product_revenue
)
SELECT *,
  ROUND((cumulative_revenue / NULLIF(grand_total, 0)) * 100, 1) AS cumulative_pct,
  CASE
    WHEN (cumulative_revenue / NULLIF(grand_total, 0)) <= 0.80 THEN 'A'
    WHEN (cumulative_revenue / NULLIF(grand_total, 0)) <= 0.95 THEN 'B'
    ELSE 'C'
  END AS abc_class
FROM ranked;

-- Geographic distribution
CREATE OR REPLACE VIEW public.vw_ecommerce_geo AS
SELECT
  client_id,
  shipping_state,
  shipping_city,
  COUNT(*) AS orders,
  SUM(total) AS revenue,
  AVG(total) AS avg_ticket,
  COUNT(DISTINCT customer_id) AS customers
FROM ecommerce_orders
WHERE status != 'cancelled' AND shipping_state IS NOT NULL
GROUP BY client_id, shipping_state, shipping_city;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_eo_client_date ON ecommerce_orders (client_id, order_date DESC);
CREATE INDEX idx_eo_customer ON ecommerce_orders (client_id, customer_id);
CREATE INDEX idx_eo_status ON ecommerce_orders (client_id, status);
CREATE INDEX idx_eoi_order ON ecommerce_order_items (order_id);
CREATE INDEX idx_ec_client ON ecommerce_customers (client_id, rfm_segment);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_access" ON ecommerce_orders FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));
CREATE POLICY "client_access" ON ecommerce_order_items FOR ALL
  USING (order_id IN (SELECT id FROM ecommerce_orders WHERE client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid())));
CREATE POLICY "client_access" ON ecommerce_products FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));
CREATE POLICY "client_access" ON ecommerce_customers FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS update_ecommerce_orders_updated_at ON ecommerce_orders;
CREATE TRIGGER update_ecommerce_orders_updated_at
  BEFORE UPDATE ON ecommerce_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ecommerce_customers_updated_at ON ecommerce_customers;
CREATE TRIGGER update_ecommerce_customers_updated_at
  BEFORE UPDATE ON ecommerce_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
