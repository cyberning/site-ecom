// ============================================
// Types partagés pour l'abstraction logistique multi-provider
// ============================================

export interface ShipmentRequest {
  orderId: string;
  trackingId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  wilayaCode: string;
  communeCode: string;
  /** Nom de la commune (certains providers, ex. dzship, attendent un nom et non un code). */
  communeName?: string;
  deliveryMode: "HOME" | "STOP_DESK";
  totalAmount: number;
  items: { name: string; quantity: number; price: number }[];
}

export interface ShipmentResponse {
  success: boolean;
  provider: string;
  providerTrackingId?: string;
  estimatedDelivery?: string;
  labelUrl?: string;
  error?: string;
}

export interface TrackingEvent {
  status: string;
  location?: string;
  timestamp: string;
  description: string;
}

export interface TrackingResponse {
  success: boolean;
  events: TrackingEvent[];
  currentStatus: string;
  error?: string;
}

export interface LogisticProvider {
  readonly name: string;
  readonly code: string;

  createShipment(request: ShipmentRequest): Promise<ShipmentResponse>;
  trackShipment(trackingId: string): Promise<TrackingResponse>;
  cancelShipment(trackingId: string): Promise<{ success: boolean; error?: string }>;
}
