import type { IcaList } from "./types";

const API_BASE = "http://localhost:3001/api/ica";

export async function checkStatus(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/status`);
  const data: { authenticated: boolean } = await res.json();
  return data.authenticated;
}

export async function startLogin(): Promise<{ qrCode: string }> {
  const res = await fetch(`${API_BASE}/login/start`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Failed to start login");
  }
  return res.json();
}

export async function pollLogin(): Promise<{
  status: "pending" | "complete" | "failed";
  qrCode?: string;
  message?: string;
}> {
  const res = await fetch(`${API_BASE}/login/poll`);
  if (!res.ok) throw new Error("Login polling failed");
  return res.json();
}

export async function cancelLogin(): Promise<void> {
  await fetch(`${API_BASE}/login/cancel`, { method: "POST" });
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/logout`, { method: "POST" });
}

export async function fetchLists(): Promise<IcaList[]> {
  const res = await fetch(`${API_BASE}/lists`);
  if (res.status === 401) throw new AuthError("Session expired. Please log in again.");
  if (!res.ok) throw new Error("Failed to fetch lists");
  return res.json();
}

export async function createList(name: string): Promise<IcaList> {
  const res = await fetch(`${API_BASE}/lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create list");
  return res.json();
}

export async function deleteList(listId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/lists/${listId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete list");
}

export async function addItem(listId: string, text: string): Promise<void> {
  await fetch(`${API_BASE}/lists/${listId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export async function removeItem(rowId: string): Promise<void> {
  await fetch(`${API_BASE}/items/${rowId}`, { method: "DELETE" });
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
