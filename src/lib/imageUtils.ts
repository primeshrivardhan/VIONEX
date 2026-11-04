/**
 * Image compression utility.
 * Compresses images client-side via HTML Canvas to ensure small payload size (under ~100 KB).
 * Rejects with an error if the compressed output still exceeds the specified maximum size (default 700 KB).
 */
export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.7,
    maxSizeBytes = 700 * 1024, // 700 KB limit
  } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("कृपया फक्त इमेज फाईल निवडा (Please select an image file)."));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("कॅनव्हास उपलब्ध नाही (Canvas not available)."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);

        // Calculate approximate byte size of base64
        const head = "data:image/jpeg;base64,";
        const rawBase64 = compressedBase64.startsWith(head)
          ? compressedBase64.substring(head.length)
          : compressedBase64;
        const approxBytes = Math.round((rawBase64.length * 3) / 4);

        if (approxBytes > maxSizeBytes) {
          reject(
            new Error(
              `फोटोचा आकार खूप मोठा आहे (${Math.round(approxBytes / 1024)} KB). कमाल मर्यादा 700 KB आहे. (Photo exceeds 700 KB).`
            )
          );
          return;
        }

        resolve(compressedBase64);
      };

      img.onerror = () => reject(new Error("फोटो वाचताना त्रुटी आली (Failed to load image)."));
    };

    reader.onerror = () => reject(new Error("फोटो लोड करताना त्रुटी आली (Failed to read file)."));
  });
}
