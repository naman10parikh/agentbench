interface Order {
  weight: number;
  country: string;
  isPrime: boolean;
  items: number;
}

const FREE_SHIPPING_WEIGHT = 5;
const PRIME_US_HEAVY_THRESHOLD = 20;
const STANDARD_US_LIGHT = 2;
const STANDARD_US_MEDIUM = 10;
const STANDARD_US_HEAVY = 30;
const NEIGHBOR_WEIGHT_THRESHOLD = 5;
const BULK_DISCOUNT_THRESHOLD = 5;
const LARGE_BULK_DISCOUNT_THRESHOLD = 10;
const BULK_DISCOUNT = 0.9;
const LARGE_BULK_DISCOUNT = 0.85;

type Region = "domestic" | "neighbor" | "international";

function getRegion(country: string): Region {
  if (country === "US") return "domestic";
  if (country === "CA" || country === "MX") return "neighbor";
  return "international";
}

function domesticShipping(weight: number, isPrime: boolean): number {
  if (isPrime) {
    if (weight <= FREE_SHIPPING_WEIGHT) return 0;
    if (weight <= PRIME_US_HEAVY_THRESHOLD) return 4.99;
    return 4.99 + (weight - PRIME_US_HEAVY_THRESHOLD) * 0.5;
  }

  if (weight <= STANDARD_US_LIGHT) return 5.99;
  if (weight <= STANDARD_US_MEDIUM) return 8.99;
  if (weight <= STANDARD_US_HEAVY) return 12.99;
  return 12.99 + (weight - STANDARD_US_HEAVY) * 0.75;
}

function neighborShipping(weight: number, isPrime: boolean): number {
  const base = isPrime ? 2.99 : 9.99;
  const perLb = isPrime ? 0.8 : 1.2;

  if (weight <= NEIGHBOR_WEIGHT_THRESHOLD) return base;
  return base + (weight - NEIGHBOR_WEIGHT_THRESHOLD) * perLb;
}

function internationalShipping(weight: number, isPrime: boolean): number {
  const base = isPrime ? 14.99 : 24.99;
  const perLb = isPrime ? 1.5 : 2.0;
  return base + weight * perLb;
}

function applyBulkDiscount(cost: number, items: number): number {
  if (items > LARGE_BULK_DISCOUNT_THRESHOLD) return cost * LARGE_BULK_DISCOUNT;
  if (items > BULK_DISCOUNT_THRESHOLD) return cost * BULK_DISCOUNT;
  return cost;
}

export function calculateShipping(order: Order): number {
  if (order.weight <= 0) return 0;

  const region = getRegion(order.country);

  let cost: number;
  switch (region) {
    case "domestic":
      cost = domesticShipping(order.weight, order.isPrime);
      break;
    case "neighbor":
      cost = neighborShipping(order.weight, order.isPrime);
      break;
    case "international":
      cost = internationalShipping(order.weight, order.isPrime);
      break;
  }

  cost = applyBulkDiscount(cost, order.items);
  return Math.round(cost * 100) / 100;
}
