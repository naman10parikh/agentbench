interface Order {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  pricePerUnit: number;
  date: string;
}

interface Customer {
  id: string;
  name: string;
  tier: "bronze" | "silver" | "gold";
}

interface Product {
  id: string;
  name: string;
  category: string;
}

interface OrderSummary {
  customerId: string;
  customerName: string;
  customerTier: string;
  totalSpent: number;
  orderCount: number;
  topCategory: string;
  averageOrderValue: number;
}

export function processOrders(
  orders: Order[],
  customers: Customer[],
  products: Product[],
): OrderSummary[] {
  // Build lookup maps: O(n) each
  const customerMap = new Map<string, Customer>();
  for (const c of customers) {
    customerMap.set(c.id, c);
  }

  const productMap = new Map<string, Product>();
  for (const p of products) {
    productMap.set(p.id, p);
  }

  // Single pass through orders: aggregate per customer
  const aggregates = new Map<
    string,
    {
      totalSpent: number;
      orderCount: number;
      categoryCounts: Map<string, number>;
    }
  >();

  for (const order of orders) {
    let agg = aggregates.get(order.customerId);
    if (!agg) {
      agg = { totalSpent: 0, orderCount: 0, categoryCounts: new Map() };
      aggregates.set(order.customerId, agg);
    }

    const spent = order.quantity * order.pricePerUnit;
    agg.totalSpent += spent;
    agg.orderCount += 1;

    const product = productMap.get(order.productId);
    if (product) {
      const prev = agg.categoryCounts.get(product.category) ?? 0;
      agg.categoryCounts.set(product.category, prev + order.quantity);
    }
  }

  // Build summaries from aggregates
  const summaries: OrderSummary[] = [];

  for (const [customerId, agg] of aggregates) {
    const customer = customerMap.get(customerId);
    if (!customer) continue;

    // Find top category by iterating the map (no sort needed)
    let topCategory = "none";
    let topCount = 0;
    for (const [category, count] of agg.categoryCounts) {
      if (count > topCount) {
        topCount = count;
        topCategory = category;
      }
    }

    summaries.push({
      customerId,
      customerName: customer.name,
      customerTier: customer.tier,
      totalSpent: agg.totalSpent,
      orderCount: agg.orderCount,
      topCategory,
      averageOrderValue: agg.totalSpent / agg.orderCount,
    });
  }

  summaries.sort((a, b) => b.totalSpent - a.totalSpent);

  return summaries;
}
