/**
 * ============================================
 * SUPABASE STORAGE — logo upload helpers
 * ============================================
 * Bucket `client-logos` was created on 2026-04-09 (public read,
 * 2MB limit, png/jpg/svg/webp). This file wraps the Supabase
 * Storage SDK calls so callers don't need to know bucket names
 * or path conventions.
 *
 * Path convention:  client-logos/{clientId}/{timestamp}-{filename}
 * ============================================
 */

import supabase from './supabase'

const BUCKET = 'client-logos'

/**
 * Upload a client logo file and return its public URL.
 *
 * @param clientId  UUID of the client (used as folder name for isolation)
 * @param file      The File object from an <input type="file"> or drag-drop
 * @returns         The public URL of the uploaded file
 * @throws          If the upload fails or Supabase returns an error
 */
export async function uploadClientLogo(
  clientId: string,
  file: File,
): Promise<string> {
  // Sanitize filename: strip accents + special chars, keep extension
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const safeName = `${Date.now()}.${ext}`
  const filePath = `${clientId}/${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // overwrite if same name (shouldn't happen with timestamp)
    })

  if (uploadError) {
    throw new Error(`Erro ao enviar logo: ${uploadError.message}`)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

/**
 * Delete the old logo from storage (best effort — doesn't throw).
 * Call this before uploading a replacement to keep the bucket clean.
 */
export async function deleteClientLogo(
  _clientId: string,
  currentUrl: string,
): Promise<void> {
  try {
    // Extract the file path from the public URL
    // URL looks like: https://<ref>.supabase.co/storage/v1/object/public/client-logos/<clientId>/<file>
    const marker = `/client-logos/`
    const idx = currentUrl.indexOf(marker)
    if (idx === -1) return
    const filePath = currentUrl.slice(idx + marker.length)

    await supabase.storage.from(BUCKET).remove([filePath])
  } catch {
    // Best effort — old file stays, not critical
    console.warn('[storage] Could not delete old logo:', currentUrl)
  }
}

/**
 * Upload a logo AND update the client record in one call.
 * Returns the new public URL.
 */
export async function uploadAndUpdateClientLogo(
  clientId: string,
  file: File,
  currentLogoUrl?: string | null,
): Promise<string> {
  // Delete old one first (best effort)
  if (currentLogoUrl) {
    await deleteClientLogo(clientId, currentLogoUrl)
  }

  const newUrl = await uploadClientLogo(clientId, file)

  // Persist the URL in the clients table
  const { error } = await supabase
    .from('clients')
    .update({ logo_url: newUrl })
    .eq('id', clientId)

  if (error) {
    console.error('[storage] Failed to persist logo_url:', error.message)
    // URL is valid though — caller can retry the DB update
  }

  return newUrl
}
