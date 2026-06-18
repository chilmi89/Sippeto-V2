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

export async function getRolesAction() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/role`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal mengambil data peran." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("getRolesAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function getRoleByIDAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/role/${id}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal mengambil detail peran." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("getRoleByIDAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function createRoleAction(name: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/role`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal membuat peran baru." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("createRoleAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function updateRoleAction(id: string, name: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/role/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal memperbarui peran." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("updateRoleAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function deleteRoleAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/role/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal menghapus peran." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("deleteRoleAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}
