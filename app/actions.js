'use server';

import { revalidateTag } from 'next/cache';

export async function mutate() {
  // No data store: only the action's router-cache invalidation is needed.
  revalidateTag('test-tag', 'max');
  return { ok: true };
}
