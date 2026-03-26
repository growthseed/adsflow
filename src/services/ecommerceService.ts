/**
 * ============================================
 * E-COMMERCE SERVICE
 * ============================================
 * Real data from Supabase ecommerce tables & views.
 * Replaces all hardcoded demo data.
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface RevenueSummary {
  month: string;
  orders: number;
  approved_orders: number;
  revenue: number;
  avg_ticket: number;
  unique_customers: number;
  new_customers: number;
  total_discounts: number;
  coupons_used: number;
}

export interface ProductABC {
  product_name: string;
  category: string | null;
  sku: string | null;
  total_revenue: number;
  total_units: number;
  cumulative_pct: number;
  abc_class: 'A' | 'B' | 'C';
}

export interface GeoDistribution {
  shipping_state: string;
  shipping_city: string | null;
  orders: number;
  revenue: number;
  avg_ticket: number;
  customers: number;
}

export interface RFMDistribution {
  segment: string;
  count: number;
  total_spent: number;
  avg_order_value: number;
}

export interface RecentOrder {
  id: string;
  order_id: string;
  platform: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  order_date: string;
  total: number;
  coupon_code: string | null;
  shipping_state: string | null;
  items?: OrderItem[];
}

export interface OrderItem {
  product_name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface EcommerceTotals {
  revenue: number;
  orders: number;
  avg_ticket: number;
  new_customers: number;
  cac: number;
  ltv: number;
}

export interface OrderUpsert {
  order_id: string;
  platform?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  is_new_customer?: boolean;
  status?: string;
  order_date: string;
  approved_date?: string | null;
  shipped_date?: string | null;
  delivered_date?: string | null;
  subtotal?: number;
  shipping_cost?: number;
  discount?: number;
  total?: number;
  coupon_code?: string | null;
  payment_method?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  shipping_state?: string | null;
  shipping_city?: string | null;
  shipping_country?: string;
  items?: Array<{
    sku?: string;
    product_name: string;
    category?: string;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
  }>;
}

// =====================================================
// SERVICE FUNCTIONS
// =====================================================

/**
 * Revenue summary from vw_ecommerce_revenue, filtered by date range.
 */
export async function getRevenueSummary(
  clientId: string,
  dateRange?: { from: string; to: string },
): Promise<RevenueSummary[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('vw_ecommerce_revenue')
    .select('*')
    .eq('client_id', clientId)
    .order('month', { ascending: true });

  if (dateRange) {
    query = query.gte('month', dateRange.from).lte('month', dateRange.to + 'T23:59:59');
  }

  const { data, error } = await query;
  if (error) {
    console.error('[ecommerceService] getRevenueSummary error:', error.message);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    month: String(r.month ?? ''),
    orders: Number(r.orders ?? 0),
    approved_orders: Number(r.approved_orders ?? 0),
    revenue: Number(r.revenue ?? 0),
    avg_ticket: Number(r.avg_ticket ?? 0),
    unique_customers: Number(r.unique_customers ?? 0),
    new_customers: Number(r.new_customers ?? 0),
    total_discounts: Number(r.total_discounts ?? 0),
    coupons_used: Number(r.coupons_used ?? 0),
  }));
}

/**
 * Product ABC curve from vw_product_abc.
 */
export async function getProductABC(clientId: string): Promise<ProductABC[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('vw_product_abc')
    .select('*')
    .eq('client_id', clientId)
    .order('total_revenue', { ascending: false });

  if (error) {
    console.error('[ecommerceService] getProductABC error:', error.message);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    product_name: String(r.product_name ?? ''),
    category: r.category ? String(r.category) : null,
    sku: r.sku ? String(r.sku) : null,
    total_revenue: Number(r.total_revenue ?? 0),
    total_units: Number(r.total_units ?? 0),
    cumulative_pct: Number(r.cumulative_pct ?? 0),
    abc_class: (String(r.abc_class ?? 'C')) as 'A' | 'B' | 'C',
  }));
}

/**
 * Geographic distribution from vw_ecommerce_geo, grouped at state level.
 */
export async function getGeographicDistribution(clientId: string): Promise<GeoDistribution[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('vw_ecommerce_geo')
    .select('*')
    .eq('client_id', clientId)
    .order('revenue', { ascending: false });

  if (error) {
    console.error('[ecommerceService] getGeographicDistribution error:', error.message);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    shipping_state: String(r.shipping_state ?? ''),
    shipping_city: r.shipping_city ? String(r.shipping_city) : null,
    orders: Number(r.orders ?? 0),
    revenue: Number(r.revenue ?? 0),
    avg_ticket: Number(r.avg_ticket ?? 0),
    customers: Number(r.customers ?? 0),
  }));
}

/**
 * RFM segment distribution from ecommerce_customers.
 */
export async function getCustomerRFM(clientId: string): Promise<RFMDistribution[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('ecommerce_customers')
    .select('rfm_segment, total_spent, avg_order_value')
    .eq('client_id', clientId)
    .not('rfm_segment', 'is', null);

  if (error) {
    console.error('[ecommerceService] getCustomerRFM error:', error.message);
    return [];
  }

  // Group by segment client-side
  const segmentMap = new Map<string, { count: number; total_spent: number; total_aov: number }>();
  (data ?? []).forEach((c: Record<string, unknown>) => {
    const seg = String(c.rfm_segment ?? 'unknown');
    const existing = segmentMap.get(seg) || { count: 0, total_spent: 0, total_aov: 0 };
    existing.count++;
    existing.total_spent += Number(c.total_spent ?? 0);
    existing.total_aov += Number(c.avg_order_value ?? 0);
    segmentMap.set(seg, existing);
  });

  return Array.from(segmentMap.entries()).map(([segment, d]) => ({
    segment,
    count: d.count,
    total_spent: d.total_spent,
    avg_order_value: d.count > 0 ? d.total_aov / d.count : 0,
  }));
}

/**
 * Recent orders with items.
 */
export async function getRecentOrders(clientId: string, limit = 20): Promise<RecentOrder[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('ecommerce_orders')
    .select('*, ecommerce_order_items(*)')
    .eq('client_id', clientId)
    .order('order_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ecommerceService] getRecentOrders error:', error.message);
    return [];
  }

  return (data ?? []).map((o: Record<string, unknown>) => ({
    id: String(o.id ?? ''),
    order_id: String(o.order_id ?? ''),
    platform: o.platform ? String(o.platform) : null,
    customer_name: o.customer_name ? String(o.customer_name) : null,
    customer_email: o.customer_email ? String(o.customer_email) : null,
    status: String(o.status ?? 'pending'),
    order_date: String(o.order_date ?? ''),
    total: Number(o.total ?? 0),
    coupon_code: o.coupon_code ? String(o.coupon_code) : null,
    shipping_state: o.shipping_state ? String(o.shipping_state) : null,
    items: Array.isArray(o.ecommerce_order_items)
      ? (o.ecommerce_order_items as Record<string, unknown>[]).map((i) => ({
          product_name: String(i.product_name ?? ''),
          sku: i.sku ? String(i.sku) : null,
          category: i.category ? String(i.category) : null,
          quantity: Number(i.quantity ?? 1),
          unit_price: Number(i.unit_price ?? 0),
          total_price: Number(i.total_price ?? 0),
        }))
      : [],
  }));
}

/**
 * CAC = total ad spend / new customers in period.
 * Joins campaign_insights (via ad_accounts.client_id) with ecommerce_orders new customers.
 */
export async function getCAC(
  clientId: string,
  dateRange?: { from: string; to: string },
): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  // Get total ad spend for the client in the period
  let spendQuery = supabase
    .from('campaign_insights')
    .select('spend, ad_account_id, ad_accounts!inner(client_id)')
    .eq('ad_accounts.client_id', clientId);

  if (dateRange) {
    spendQuery = spendQuery.gte('date', dateRange.from).lte('date', dateRange.to);
  }

  const { data: spendData } = await spendQuery;
  const totalSpend = (spendData ?? []).reduce(
    (sum: number, r: Record<string, unknown>) => sum + Number(r.spend ?? 0),
    0,
  );

  // Get new customers in the period
  let custQuery = supabase
    .from('ecommerce_orders')
    .select('customer_id')
    .eq('client_id', clientId)
    .eq('is_new_customer', true);

  if (dateRange) {
    custQuery = custQuery.gte('order_date', dateRange.from).lte('order_date', dateRange.to + 'T23:59:59');
  }

  const { data: custData } = await custQuery;
  const newCustomers = new Set((custData ?? []).map((r: Record<string, unknown>) => r.customer_id)).size;

  return newCustomers > 0 ? totalSpend / newCustomers : 0;
}

/**
 * LTV = average total_spent from ecommerce_customers.
 */
export async function getLTV(clientId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const { data, error } = await supabase
    .from('ecommerce_customers')
    .select('total_spent')
    .eq('client_id', clientId)
    .gt('total_orders', 0);

  if (error) {
    console.error('[ecommerceService] getLTV error:', error.message);
    return 0;
  }

  const customers = data ?? [];
  if (customers.length === 0) return 0;

  const totalSpent = customers.reduce(
    (sum: number, c: Record<string, unknown>) => sum + Number(c.total_spent ?? 0),
    0,
  );
  return totalSpent / customers.length;
}

/**
 * Bulk upsert orders from an e-commerce platform.
 * Uses ON CONFLICT (client_id, order_id) to deduplicate.
 */
export async function syncOrders(clientId: string, orders: OrderUpsert[]): Promise<{ inserted: number; errors: string[] }> {
  if (!isSupabaseConfigured) return { inserted: 0, errors: ['Supabase not configured'] };

  const errors: string[] = [];
  let inserted = 0;

  // Process in batches of 100
  const BATCH = 100;
  for (let i = 0; i < orders.length; i += BATCH) {
    const batch = orders.slice(i, i + BATCH);

    const orderRows = batch.map((o) => ({
      client_id: clientId,
      order_id: o.order_id,
      platform: o.platform,
      customer_id: o.customer_id,
      customer_name: o.customer_name,
      customer_email: o.customer_email,
      customer_phone: o.customer_phone,
      is_new_customer: o.is_new_customer ?? true,
      status: o.status ?? 'pending',
      order_date: o.order_date,
      approved_date: o.approved_date,
      shipped_date: o.shipped_date,
      delivered_date: o.delivered_date,
      subtotal: o.subtotal ?? 0,
      shipping_cost: o.shipping_cost ?? 0,
      discount: o.discount ?? 0,
      total: o.total ?? 0,
      coupon_code: o.coupon_code,
      payment_method: o.payment_method,
      utm_source: o.utm_source,
      utm_medium: o.utm_medium,
      utm_campaign: o.utm_campaign,
      utm_content: o.utm_content,
      shipping_state: o.shipping_state,
      shipping_city: o.shipping_city,
      shipping_country: o.shipping_country ?? 'BR',
    }));

    const { data: upserted, error } = await supabase
      .from('ecommerce_orders')
      .upsert(orderRows, { onConflict: 'client_id,order_id' })
      .select('id, order_id');

    if (error) {
      errors.push(`Batch ${i / BATCH + 1}: ${error.message}`);
      continue;
    }

    inserted += (upserted ?? []).length;

    // Insert order items for each upserted order
    const itemRows: Array<Record<string, unknown>> = [];
    for (const order of batch) {
      if (!order.items?.length) continue;
      const matchedOrder = (upserted ?? []).find(
        (u: Record<string, unknown>) => u.order_id === order.order_id,
      );
      if (!matchedOrder) continue;

      for (const item of order.items) {
        itemRows.push({
          order_id: matchedOrder.id,
          sku: item.sku,
          product_name: item.product_name,
          category: item.category,
          quantity: item.quantity ?? 1,
          unit_price: item.unit_price ?? 0,
          total_price: item.total_price ?? 0,
        });
      }
    }

    if (itemRows.length > 0) {
      // Delete existing items for these orders, then re-insert
      const orderIds = (upserted ?? []).map((u: Record<string, unknown>) => u.id);
      await supabase.from('ecommerce_order_items').delete().in('order_id', orderIds);

      const { error: itemError } = await supabase.from('ecommerce_order_items').insert(itemRows);
      if (itemError) {
        errors.push(`Items batch ${i / BATCH + 1}: ${itemError.message}`);
      }
    }
  }

  return { inserted, errors };
}

/**
 * Compute RFM scores and segments for all customers of a client.
 * Reads from ecommerce_orders, writes to ecommerce_customers.
 */
export async function calculateRFM(clientId: string): Promise<{ updated: number }> {
  if (!isSupabaseConfigured) return { updated: 0 };

  // Get all orders for this client (non-cancelled)
  const { data: orders, error } = await supabase
    .from('ecommerce_orders')
    .select('customer_id, customer_name, customer_email, customer_phone, order_date, total, is_new_customer')
    .eq('client_id', clientId)
    .neq('status', 'cancelled')
    .neq('status', 'refunded')
    .order('order_date', { ascending: false });

  if (error || !orders?.length) return { updated: 0 };

  // Aggregate by customer
  const customerMap = new Map<
    string,
    {
      name: string | null;
      email: string | null;
      phone: string | null;
      first_order: Date;
      last_order: Date;
      total_orders: number;
      total_spent: number;
    }
  >();

  for (const o of orders as Record<string, unknown>[]) {
    const cid = String(o.customer_id ?? '');
    if (!cid) continue;

    const orderDate = new Date(String(o.order_date));
    const total = Number(o.total ?? 0);
    const existing = customerMap.get(cid);

    if (existing) {
      existing.total_orders++;
      existing.total_spent += total;
      if (orderDate < existing.first_order) existing.first_order = orderDate;
      if (orderDate > existing.last_order) existing.last_order = orderDate;
    } else {
      customerMap.set(cid, {
        name: o.customer_name ? String(o.customer_name) : null,
        email: o.customer_email ? String(o.customer_email) : null,
        phone: o.customer_phone ? String(o.customer_phone) : null,
        first_order: orderDate,
        last_order: orderDate,
        total_orders: 1,
        total_spent: total,
      });
    }
  }

  const customers = Array.from(customerMap.entries());
  if (customers.length === 0) return { updated: 0 };

  const now = Date.now();

  // Calculate RFM raw values
  const recencyDays = customers.map(([, c]) => Math.floor((now - c.last_order.getTime()) / 86400000));
  const frequencies = customers.map(([, c]) => c.total_orders);
  const monetaries = customers.map(([, c]) => c.total_spent);

  // Quintile helper
  function quintile(values: number[], value: number, reverse = false): number {
    const sorted = [...values].sort((a, b) => a - b);
    const idx = sorted.indexOf(value);
    const pct = idx / sorted.length;
    const q = Math.ceil(pct * 5) || 1;
    return reverse ? 6 - q : q; // reverse for recency (lower days = higher score)
  }

  // Build upsert rows
  const upsertRows = customers.map(([customerId, c], i) => {
    const r = quintile(recencyDays, recencyDays[i], true);
    const f = quintile(frequencies, frequencies[i]);
    const m = quintile(monetaries, monetaries[i]);

    // Segment based on RFM
    let segment = 'potential';
    const score = r + f + m;
    if (r >= 4 && f >= 4 && m >= 4) segment = 'champions';
    else if (f >= 3 && m >= 3) segment = 'loyal';
    else if (r >= 4 && f <= 2) segment = 'new';
    else if (r <= 2 && f >= 2) segment = 'at_risk';
    else if (r <= 1 && f <= 2) segment = 'lost';
    else if (score >= 9) segment = 'loyal';
    else if (score <= 5) segment = 'lost';

    return {
      client_id: clientId,
      customer_id: customerId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      first_order_date: c.first_order.toISOString(),
      last_order_date: c.last_order.toISOString(),
      total_orders: c.total_orders,
      total_spent: c.total_spent,
      avg_order_value: c.total_orders > 0 ? c.total_spent / c.total_orders : 0,
      rfm_recency: r,
      rfm_frequency: f,
      rfm_monetary: m,
      rfm_segment: segment,
    };
  });

  // Upsert in batches
  let updated = 0;
  const BATCH = 100;
  for (let i = 0; i < upsertRows.length; i += BATCH) {
    const batch = upsertRows.slice(i, i + BATCH);
    const { data: result } = await supabase
      .from('ecommerce_customers')
      .upsert(batch, { onConflict: 'client_id,customer_id' })
      .select('id');
    updated += (result ?? []).length;
  }

  return { updated };
}

/**
 * Aggregated totals for KPI cards (combines multiple queries).
 */
export async function getEcommerceTotals(
  clientId: string,
  dateRange?: { from: string; to: string },
): Promise<EcommerceTotals> {
  const [revenue, cac, ltv] = await Promise.all([
    getRevenueSummary(clientId, dateRange),
    getCAC(clientId, dateRange),
    getLTV(clientId),
  ]);

  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = revenue.reduce((s, r) => s + r.approved_orders, 0);
  const totalNewCustomers = revenue.reduce((s, r) => s + r.new_customers, 0);

  return {
    revenue: totalRevenue,
    orders: totalOrders,
    avg_ticket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    new_customers: totalNewCustomers,
    cac,
    ltv,
  };
}
