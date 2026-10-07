import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Toast } from "@capacitor/toast";

export interface DownloadFileOptions {
  fileName: string;
  data: string | Blob;
  mimeType?: string;
  dialogTitle?: string;
  language?: "mr" | "en";
}

/**
 * Converts a Blob to a pure base64 string (without the data URL prefix)
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const commaIndex = res ? res.indexOf(",") : -1;
      resolve(commaIndex !== -1 ? res.substring(commaIndex + 1) : (res || ""));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Universal file download utility.
 * - On Native Android/iOS: writes the file to Directory.Cache and opens the native Share/Save sheet
 *   (or saves it directly with Toast notification), allowing user to save to device storage,
 *   Google Drive, WhatsApp, Files, etc.
 * - On Web / Desktop PWA: falls back to standard Blob + <a> download anchor.
 */
export async function downloadFile({
  fileName,
  data,
  mimeType,
  dialogTitle,
  language,
}: DownloadFileOptions): Promise<boolean> {
  const isEn =
    language === "en" ||
    (!language &&
      typeof localStorage !== "undefined" &&
      localStorage.getItem("vionex-app-language") === "en");

  try {
    if (Capacitor.isNativePlatform()) {
      // 1. Prepare Base64 data for Capacitor Filesystem
      let base64Data = "";
      if (typeof data === "string") {
        if (data.startsWith("data:")) {
          const commaIndex = data.indexOf(",");
          base64Data = commaIndex !== -1 ? data.substring(commaIndex + 1) : data;
        } else {
          // Plain text / CSV / JSON (safely handle UTF-8 / Marathi characters)
          try {
            base64Data = btoa(unescape(encodeURIComponent(data)));
          } catch {
            const blob = new Blob([data], { type: mimeType || "text/plain;charset=utf-8" });
            base64Data = await blobToBase64(blob);
          }
        }
      } else if (data instanceof Blob) {
        base64Data = await blobToBase64(data);
      }

      // 2. Write file to Directory.Cache for reliable FileProvider sharing on Android
      const fileResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // 3. Open native system Share/Save sheet
      try {
        await Share.share({
          title: fileName,
          url: fileResult.uri,
          dialogTitle: dialogTitle || (isEn ? "Save / Share File" : "फाइल सेव्ह / शेअर करा"),
        });
      } catch (shareError: any) {
        // User cancelling or dismissing the share sheet is normal
        console.log("Native share result:", shareError);
      }

      await Toast.show({
        text: isEn ? `File saved: ${fileName}` : `फाइल सेव्ह झाली: ${fileName}`,
        duration: "short",
      });

      return true;
    } else {
      // Browser / PWA fallback
      let blobUrl = "";
      let shouldRevoke = false;

      if (typeof data === "string" && data.startsWith("data:")) {
        blobUrl = data;
      } else if (data instanceof Blob) {
        blobUrl = URL.createObjectURL(data);
        shouldRevoke = true;
      } else {
        const blob = new Blob([data], { type: mimeType || "text/plain;charset=utf-8" });
        blobUrl = URL.createObjectURL(blob);
        shouldRevoke = true;
      }

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (shouldRevoke) {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }

      return true;
    }
  } catch (error: any) {
    console.error("downloadFile failed:", error);
    try {
      await Toast.show({
        text: isEn ? `Download failed: ${error?.message || "Error"}` : `फाइल डाउनलोड अयशस्वी: ${error?.message || "त्रुटी"}`,
        duration: "long",
      });
    } catch {
      alert(isEn ? `Download failed: ${error?.message || "Error"}` : `फाइल डाउनलोड अयशस्वी: ${error?.message || "त्रुटी"}`);
    }
    return false;
  }
}
