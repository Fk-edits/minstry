// ============================================================
// CLOUDFLARE R2 UPLOAD MODULE
// ============================================================
import { showToast } from './utils.js';

const R2_WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL'; // Replace with your worker URL

/**
 * Upload a file to Cloudflare R2 using a presigned URL
 * @param {File} file - The file to upload
 * @param {string} filename - The name to save as
 * @returns {Promise<string>} The public URL of the uploaded file
 */
export async function uploadToR2(file, filename) {
  try {
    // Step 1: Request presigned URL from your worker
    const presignRes = await fetch(`${R2_WORKER_URL}/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, contentType: file.type })
    });
    if (!presignRes.ok) throw new Error('Failed to get presigned URL');
    const { uploadURL, publicURL } = await presignRes.json();

    // Step 2: Upload file directly to R2
    const uploadRes = await fetch(uploadURL, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });
    if (!uploadRes.ok) throw new Error('Upload failed');

    return publicURL;
  } catch (err) {
    console.error('R2 upload error:', err);
    showToast('Image upload failed.', 'error');
    throw err;
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleToR2(files) {
  const urls = [];
  for (const file of files) {
    const url = await uploadToR2(file, file.name);
    urls.push(url);
  }
  return urls;
}