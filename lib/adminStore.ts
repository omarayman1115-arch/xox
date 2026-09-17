import type { Property } from "./types";
import { MOCK_PROPERTIES } from "./mockData";

/** مخزن مؤقت في الذاكرة للوضع التجريبي — يخلي لوحة التحكم تشغل إضافة/تعديل/حذف من غير Supabase */

let store: Property[] | null = null;

function ensure() {
  if (!store) store = [...MOCK_PROPERTIES];
}

export function mockList(): Property[] {
  ensure();
  return store!;
}

export function mockGet(id: string): Property | null {
  ensure();
  return store!.find((p) => p.id === id) ?? null;
}

export function mockCreate(p: Property): Property {
  ensure();
  store!.unshift(p);
  return p;
}

export function mockUpdate(id: string, patch: Partial<Property>): Property | null {
  ensure();
  const idx = store!.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store![idx] = { ...store![idx], ...patch };
  return store![idx];
}

export function mockDelete(id: string): boolean {
  ensure();
  const before = store!.length;
  store! = store!.filter((p) => p.id !== id);
  return store!.length < before;
}
