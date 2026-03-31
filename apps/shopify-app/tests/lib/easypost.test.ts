import { describe, it, expect } from "vitest";
import {
  getTrackerStatus,
  rebookDelivery,
} from "~/lib/easypost/client.server";

// EasyPost mock is set up in tests/setup.ts via vi.mock("@easypost/api")
// The mock returns: status="in_transit", carrier="UPS", est_delivery_date, tracking_details

describe("easypost/client.server", () => {
  const apiKey = "EZTKFAKEKEY";

  describe("getTrackerStatus", () => {
    it("returns status from EasyPost tracker", async () => {
      const result = await getTrackerStatus(apiKey, "trk_test_001");
      expect(result.status).toBe("in_transit");
    });

    it("returns carrier", async () => {
      const result = await getTrackerStatus(apiKey, "trk_test_001");
      expect(result.carrier).toBe("UPS");
    });

    it("returns tracking events array", async () => {
      const result = await getTrackerStatus(apiKey, "trk_test_001");
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0]).toHaveProperty("message");
    });

    it("returns estimated delivery date", async () => {
      const result = await getTrackerStatus(apiKey, "trk_test_001");
      // field is estimatedDeliveryDate (camelCase) per GetTrackingOutput type
      expect(result.estimatedDeliveryDate).toBeDefined();
    });
  });

  describe("rebookDelivery", () => {
    const newAddress = {
      street1: "456 Oak Avenue",
      city: "Brooklyn",
      state: "NY",
      zip: "11201",
      country: "US",
    };

    it("returns success=true when rebook succeeds", async () => {
      const result = await rebookDelivery(apiKey, "gid://shopify/Order/999", newAddress);
      expect(result.success).toBe(true);
    });

    it("returns a new tracker ID", async () => {
      const result = await rebookDelivery(apiKey, "gid://shopify/Order/999", newAddress);
      expect(result.newTrackerId).toBeDefined();
    });

    it("returns a message describing the rebook", async () => {
      const result = await rebookDelivery(apiKey, "gid://shopify/Order/999", newAddress);
      expect(typeof result.message).toBe("string");
    });
  });
});
