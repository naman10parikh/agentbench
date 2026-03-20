interface Order {
  weight: number;
  country: string;
  isPrime: boolean;
  items: number;
}

export function calculateShipping(order: Order): number {
  let cost = 0;
  if (order.weight > 0) {
    if (order.country === "US") {
      if (order.isPrime) {
        if (order.weight <= 5) {
          cost = 0;
        } else {
          if (order.weight <= 20) {
            cost = 4.99;
          } else {
            cost = 4.99 + (order.weight - 20) * 0.5;
          }
        }
      } else {
        if (order.weight <= 2) {
          cost = 5.99;
        } else {
          if (order.weight <= 10) {
            cost = 8.99;
          } else {
            if (order.weight <= 30) {
              cost = 12.99;
            } else {
              cost = 12.99 + (order.weight - 30) * 0.75;
            }
          }
        }
      }
    } else {
      if (order.country === "CA" || order.country === "MX") {
        if (order.isPrime) {
          if (order.weight <= 5) {
            cost = 2.99;
          } else {
            cost = 2.99 + (order.weight - 5) * 0.8;
          }
        } else {
          if (order.weight <= 5) {
            cost = 9.99;
          } else {
            cost = 9.99 + (order.weight - 5) * 1.2;
          }
        }
      } else {
        if (order.isPrime) {
          cost = 14.99 + order.weight * 1.5;
        } else {
          cost = 24.99 + order.weight * 2.0;
        }
      }
    }
    if (order.items > 5) {
      cost = cost * 0.9;
    }
    if (order.items > 10) {
      cost = cost * 0.85;
    }
  }
  return Math.round(cost * 100) / 100;
}
