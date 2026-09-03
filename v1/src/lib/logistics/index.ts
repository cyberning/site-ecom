import { LogisticProvider, ShipmentRequest } from "./types";
import { EcotrackProvider } from "./providers/ecotrack";
import { DzshipProvider } from "./providers/dzship";

const providers = new Map<string, LogisticProvider>();

function getProvider(code: string): LogisticProvider {
  const upperCode = code.toUpperCase();
  if (providers.has(upperCode)) return providers.get(upperCode)!;

  let provider: LogisticProvider;
  switch (upperCode) {
    case "ECOTRACK":
      provider = new EcotrackProvider();
      break;
    // Future providers:
    // case "ZR_EXPRESS": provider = new ZrExpressProvider(); break;
    // case "YALIDINE": provider = new YalidineProvider(); break;
    default:
      throw new Error(`Provider logistique inconnu: ${code}`);
  }

  providers.set(upperCode, provider);
  return provider;
}

export function createShipment(providerCode: string, request: ShipmentRequest) {
  return getProvider(providerCode).createShipment(request);
}

export function trackShipment(providerCode: string, trackingId: string) {
  return getProvider(providerCode).trackShipment(trackingId);
}

export function cancelShipment(providerCode: string, trackingId: string) {
  return getProvider(providerCode).cancelShipment(trackingId);
}

/**
 * Crée un colis via dzship pour un transporteur configuré dynamiquement
 * (une instance = une connexion transporteur, credentials envoyés à chaque appel).
 */
export function createShipmentForCourier(
  courier: string,
  credentials: Record<string, string>,
  request: ShipmentRequest,
  options?: { baseUrl?: string }
) {
  const provider = new DzshipProvider({
    courier,
    credentials,
    baseUrl: options?.baseUrl,
  });
  return provider.createShipment(request);
}

export type {
  LogisticProvider,
  ShipmentRequest,
  ShipmentResponse,
  TrackingResponse,
  TrackingEvent,
} from "./types";
