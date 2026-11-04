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

export interface ReverseGeocodeResult {
  rawState: string;
  rawDistrict: string;
  rawTaluka: string;
  rawVillage: string;
  rawPincode: string;
  addrValues: string[];
  displayName: string;
  country: string;
}

/**
 * Reverse geocodes coordinates trying BigDataCloud first, falling back to Nominatim (with no forbidden User-Agent header).
 * Returns structured address components or null if both fail.
 */
export async function reverseGeocodeWithFallback(
  lat: number,
  lon: number
): Promise<ReverseGeocodeResult | null> {
  // 1. Try BigDataCloud first
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && (data.principalSubdivision || data.locality || data.city)) {
        const admin = Array.isArray(data.localityInfo?.administrative) ? data.localityInfo.administrative : [];
        const info = Array.isArray(data.localityInfo?.informative) ? data.localityInfo.informative : [];

        const distObj = admin.find((a: any) => /district|division|county/i.test(a.description || "") || a.order === 5);
        const rawDistrict = distObj?.name || "";

        const talukaObj = admin.find((a: any) => /subdistrict|taluk|tehsil|block|mandal/i.test(a.description || "") || a.order === 6);
        const rawTaluka = talukaObj?.name || data.city || "";

        const villageObj = admin.find((a: any) => /locality|village|neighbourhood|ward/i.test(a.description || "") || a.order >= 7);
        const rawVillage = data.locality || villageObj?.name || "";

        const rawPincode = (data.postcode || "").match(/\b\d{6}\b/)?.[0] || data.postcode || "";

        const addrValues: string[] = [
          ...admin.map((a: any) => String(a.name || "")),
          ...info.map((a: any) => String(a.name || "")),
          data.city,
          data.locality,
          data.principalSubdivision,
          data.countryName,
        ].filter(Boolean);

        const displayName = [data.locality, data.city, rawTaluka, rawDistrict, data.principalSubdivision, data.postcode, data.countryName]
          .filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i)
          .join(", ");

        return {
          rawState: data.principalSubdivision || "",
          rawDistrict,
          rawTaluka,
          rawVillage,
          rawPincode,
          addrValues,
          displayName: displayName || "Location resolved via BigDataCloud",
          country: data.countryName || "India",
        };
      }
    }
  } catch (err) {
    console.warn("BigDataCloud reverse geocode failed, trying Nominatim fallback...", err);
  }

  // 2. Try Nominatim fallback (without forbidden User-Agent header)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=en-US,en`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const rawState = addr.state || "";
        const rawDistrict = addr.state_district || addr.district || addr.county || addr.city_district || "";
        const rawTaluka = addr.subdistrict || addr.tehsil || addr.taluk || addr.suburb || addr.taluka || addr.city || addr.town || addr.municipality || "";
        const rawVillage = addr.village || addr.suburb || addr.town || addr.neighbourhood || addr.hamlet || addr.locality || addr.croft || "";

        const match = `${addr.postcode || ""} ${data.display_name || ""}`.match(/\b\d{6}\b/);
        const rawPincode = match ? match[0] : (addr.postcode || "");

        const addrValues: string[] = [
          ...Object.values(addr).map((v) => String(v)),
          ...(data.display_name ? data.display_name.split(",").map((s: string) => s.trim()) : []),
        ].filter(Boolean);

        return {
          rawState,
          rawDistrict,
          rawTaluka,
          rawVillage,
          rawPincode,
          addrValues,
          displayName: data.display_name || "",
          country: addr.country || "India",
        };
      }
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode failed:", err);
  }

  return null;
}
