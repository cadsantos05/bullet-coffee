export const STORE_NAME = 'Bullet Coffee';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Processing Payment',
  received: 'Order Received',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  picked_up: 'Picked Up',
  cancelled: 'Cancelled',
};
