import EasyPost from "@easypost/api";
import type { GetTrackingOutput, RebookDeliveryOutput } from "@delivai/shared-types";

export function getEasyPostClient(apiKey: string): InstanceType<typeof EasyPost> {
  return new EasyPost(apiKey);
}

export async function getTrackerStatus(
  apiKey: string,
  trackerId: string,
): Promise<GetTrackingOutput> {
  const client = getEasyPostClient(apiKey);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tracker = await (client.Tracker as any).retrieve(trackerId);

  return {
    status: tracker.status ?? "unknown",
    statusDetail: tracker.status_detail ?? "",
    carrier: tracker.carrier ?? "unknown",
    trackingCode: tracker.tracking_code ?? "",
    estimatedDeliveryDate: tracker.est_delivery_date ?? null,
    events: (tracker.tracking_details ?? []).map(
      (e: { message: string; tracking_location: { city?: string; state?: string }; datetime: string }) => ({
        message: e.message,
        location: [e.tracking_location?.city, e.tracking_location?.state]
          .filter(Boolean)
          .join(", "),
        datetime: e.datetime,
      }),
    ),
  };
}

export async function createTrackerForCode(
  apiKey: string,
  trackingCode: string,
  carrier?: string,
): Promise<string> {
  const client = getEasyPostClient(apiKey);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tracker = await (client.Tracker as any).create({
    tracking_code: trackingCode,
    carrier: carrier ?? "",
  });
  return tracker.id as string;
}

export async function rebookDelivery(
  apiKey: string,
  orderId: string,
  newAddress: {
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  },
  parcelDetails: { weight: number; length?: number; width?: number; height?: number } = {
    weight: 16,
  },
): Promise<RebookDeliveryOutput> {
  const client = getEasyPostClient(apiKey);

  try {
    // Create new address
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toAddress = await (client.Address as any).create({
      street1: newAddress.street1,
      city: newAddress.city,
      state: newAddress.state,
      zip: newAddress.zip,
      country: newAddress.country,
    });

    // Create parcel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parcel = await (client.Parcel as any).create({
      weight: parcelDetails.weight,
      length: parcelDetails.length ?? 10,
      width: parcelDetails.width ?? 8,
      height: parcelDetails.height ?? 4,
    });

    // Create shipment (from address would be the merchant's address in production)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shipment = await (client.Shipment as any).create({
      to_address: toAddress.id,
      parcel: parcel.id,
      // from_address set via EasyPost account default or passed separately
    });

    // Select cheapest rate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lowestRate = (client.Shipment as any).lowestRate(shipment);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boughtShipment = await (client.Shipment as any).buy(shipment.id, lowestRate);

    const trackerId = boughtShipment.tracker?.id ?? null;

    return {
      success: true,
      newTrackerId: trackerId,
      message: `Delivery rebooked. New tracking: ${boughtShipment.tracker?.tracking_code ?? "N/A"}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, newTrackerId: null, message: `Rebook failed: ${message}` };
  }
}
