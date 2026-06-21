/**
 * Kompresi gambar client-side menjadi format WebP dengan batas maksimal resolusi
 * dan kualitas kompresi yang optimal.
 */
export async function compressImageToWebp(file: File, maxDimension = 800, quality = 0.8): Promise<File> {
  // Hanya proses jika file adalah gambar dan di lingkungan browser
  if (typeof window === "undefined" || !window.HTMLCanvasElement || !file.type.startsWith("image/")) {
    return file;
  }

  // Jika file adalah SVG, lewati kompresi karena SVG bersifat vektor
  if (file.type === "image/svg+xml") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Hitung skala rasio agar resolusi tidak melebihi maxDimension
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Gambar ulang di canvas dengan dimensi yang telah diubah
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke blob WebP dengan tingkat kualitas optimal
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Buat file baru berbasis WebP dengan ekstensi .webp
            const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([blob], newName, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
