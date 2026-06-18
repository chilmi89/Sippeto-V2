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

export async function getRolePermissionsAction(roleId?: string) {
  try {
    const headers = await getHeaders();
    let url = `${BACKEND_API_URL}/role-permission`;
    if (roleId) {
      url += `?role_id=${roleId}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal mengambil data izin peran." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("getRolePermissionsAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function assignPermissionAction(roleId: string, permissionId: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/role-permission`, {
      method: "POST",
      headers,
      body: JSON.stringify({ role_id: roleId, permission_id: permissionId }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal memberikan izin ke peran." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("assignPermissionAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

export async function revokePermissionAction(roleId: string, permissionId: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/role-permission`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ role_id: roleId, permission_id: permissionId }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Gagal mencabut izin dari peran." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("revokePermissionAction Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}
