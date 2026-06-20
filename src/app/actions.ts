'use server'

import { updateTag } from 'next/cache'

// Called from the panel (client) after a successful browser-side write so the
// public landing page reflects the change on the next visit. `updateTag`
// expires the entry immediately (read-your-own-writes), so a reload of `/`
// shows fresh data rather than stale-while-revalidate.

export async function revalidateServices() {
  updateTag('services')
}

export async function revalidateClinicInfo() {
  updateTag('clinic-info')
}

export async function revalidateGallery() {
  updateTag('gallery')
}
