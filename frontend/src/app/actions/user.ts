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

export async function getUsersAction() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/users`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal mengambil data users." };
    }
    return { success: true, data: data.data };
  } catch (err) {
    console.error("getUsersAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function getUserByIDAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/users/${id}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal mengambil data user." };
    }
    return { success: true, data: data.data };
  } catch (err) {
    console.error("getUserByIDAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function createUserAction(payload: any) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/users`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal menambahkan user baru." };
    }
    return { success: true, data: data.data, message: data.message };
  } catch (err) {
    console.error("createUserAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function updateUserAction(id: string, payload: any) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/users/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal memperbarui data user." };
    }
    return { success: true, data: data.data, message: data.message };
  } catch (err) {
    console.error("updateUserAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function deleteUserAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/users/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal menghapus user." };
    }
    return { success: true, message: data.message };
  } catch (err) {
    console.error("deleteUserAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}
