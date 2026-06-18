"use server";

import { cookies } from "next/headers";
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8080/api";

async function getHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function getPermissionsAction() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/permission`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal mengambil data izin." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("getPermissionsAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function getPermissionByIDAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/permission/${id}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal mengambil detail izin." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("getPermissionByIDAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function createPermissionAction(name: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/permission`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal membuat izin baru." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("createPermissionAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function updatePermissionAction(id: string, name: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/permission/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal memperbarui izin." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("updatePermissionAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function deletePermissionAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/permission/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal menghapus izin." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("deletePermissionAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}
