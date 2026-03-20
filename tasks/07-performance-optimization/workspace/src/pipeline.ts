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
  const summaries: OrderSummary[] = [];

  // Get unique customer IDs from orders
  const customerIds: string[] = [];
  for (const order of orders) {
    if (!customerIds.includes(order.customerId)) {
      customerIds.push(order.customerId);
    }
  }

  for (const customerId of customerIds) {
    // Find customer (O(n) scan each time)
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) continue;

    // Find all orders for this customer (O(n) scan each time)
    const customerOrders = orders.filter((o) => o.customerId === customerId);

    let totalSpent = 0;
    const categoryCounts: { category: string; count: number }[] = [];

    for (const order of customerOrders) {
      totalSpent += order.quantity * order.pricePerUnit;

      // Find product for each order (O(n) scan each time)
      const product = products.find((p) => p.id === order.productId);
      if (product) {
        // Find category count (O(n) scan each time)
        const existing = categoryCounts.find(
          (cc) => cc.category === product.category,
        );
        if (existing) {
          existing.count += order.quantity;
        } else {
          categoryCounts.push({
            category: product.category,
            count: order.quantity,
          });
        }
      }
    }

    // Sort categories to find top one (inside the outer loop!)
    categoryCounts.sort((a, b) => b.count - a.count);
    const topCategory =
      categoryCounts.length > 0 ? categoryCounts[0].category : "none";

    summaries.push({
      customerId,
      customerName: customer.name,
      customerTier: customer.tier,
      totalSpent,
      orderCount: customerOrders.length,
      topCategory,
      averageOrderValue: totalSpent / customerOrders.length,
    });
  }

  // Sort by total spent descending (fine, only once)
  summaries.sort((a, b) => b.totalSpent - a.totalSpent);

  return summaries;
}
