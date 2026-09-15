export interface GeoResult {
  latitude: number;
  longitude: number;
  source: "high_accuracy" | "low_accuracy" | "ip_fallback";
}

/**
 * Fast, resilient GPS location helper.
 * - Attempts Capacitor Geolocation first if available (Native App).
 * - Falls back to browser geolocation.
 * - On timeout/error, retries with low accuracy.
 * - On failure, falls back to fast IP geolocation service.
 */
export async function getSmartLocation(): Promise<GeoResult | null> {
  if (typeof window === "undefined") return null;

  try {
    const hasCapacitor = !!(window as any).Capacitor;
    if (hasCapacitor) {
      // Try Native Capacitor GPS
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        });
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: "high_accuracy",
        };
      } catch (capErr) {
        console.warn("Capacitor high accuracy failed, trying low accuracy...", capErr);
        const { Geolocation } = await import('@capacitor/geolocation');
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        });
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: "low_accuracy",
        };
      }
    }
  } catch (e) {
    console.warn("Capacitor geolocation failed, falling back to browser.", e);
  }

  // 1. Try High Accuracy (Browser)
  if ("geolocation" in navigator) {
    try {
      const res = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 30000,
        });
      });
      return {
        latitude: res.coords.latitude,
        longitude: res.coords.longitude,
        source: "high_accuracy",
      };
    } catch (err1) {
      console.warn("High accuracy GPS failed/timed out, retrying with low accuracy...", err1);
    }

    // 2. Try Low Accuracy (Wi-Fi / Cell tower - very fast on mobile)
    try {
      const res = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 7000,
          maximumAge: 300000,
        });
      });
      return {
        latitude: res.coords.latitude,
        longitude: res.coords.longitude,
        source: "low_accuracy",
      };
    } catch (err2) {
      console.warn("Low accuracy GPS failed, trying IP fallback...", err2);
    }
  }

  // 3. Fallback to IP Geolocation
  return await getIpLocationFallback();
}

async function getIpLocationFallback(): Promise<GeoResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client", {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.latitude === "number" && typeof data.longitude === "number") {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          source: "ip_fallback",
        };
      }
    }
  } catch (e) {
    console.warn("IP geolocation fallback failed:", e);
  }
  return null;
}
