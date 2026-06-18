"use server";

export async function uploadFileAction(
  formData: FormData,
  type: "avatar" | "banner" | "qr" | "product",
  opts?: { name?: string; tenant?: string },
) {
  try {
    const file = formData.get("file") as File | null;
    if (!file) {
      throw new Error(`File gambar ${type} tidak terdeteksi`);
    }

    // Gunakan port 8080 secara default untuk backend Golang di lokal
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8080/api";
    const bucketType =
      type === "avatar" || type === "banner" ? "profile" : "product";
    const params = new URLSearchParams({ bucket: bucketType });
    if (opts?.name) params.set("name", opts.name);
    if (opts?.tenant) params.set("tenant", opts.tenant);
    const uploadUrl = `${backendUrl}/storage/upload?${params}`;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: uploadFormData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.error ||
          `Gagal mengunggah berkas ke backend (Status: ${response.status})`,
      );
    }

    const respJson = await response.json();
    if (!respJson.data || !respJson.data.url) {
      throw new Error("Respons backend tidak menyertakan URL berkas");
    }

    return { url: respJson.data.url };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kegagalan sistem saat mengunggah berkas";
    console.error(`SYSTEM ${type.toUpperCase()} UPLOAD ERROR:`, error);
    return { error: errorMessage };
  }
}
