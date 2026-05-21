// src/lib/storage.ts
import { supabase } from './supabase';

/**
 * Security Gatekeeper for file uploads.
 * Prevents malicious files or oversized payloads from reaching the Supabase storage buckets.
 * 
 * @param file - The raw File object from the HTML input
 * @param maxSizeMB - Maximum allowed size in Megabytes (defaults to 10MB)
 * @param allowedTypes - Array of permitted MIME types (defaults to PDF, DOCX, PNG, JPEG)
 * @returns Object indicating validity, and an error message if invalid
 */
export const validateFileUpload = (
  file: File,
  maxSizeMB: number = 10,
  allowedTypes: string[] = [
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'image/png', 
    'image/jpeg'
  ]
): { isValid: boolean; error?: string } => {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    return { isValid: false, error: `File exceeds the ${maxSizeMB}MB limit.` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file format. Please upload an approved document type.' };
  }

  return { isValid: true };
};

/**
 * Generates a secure, temporary URL for accessing private IP assets.
 * Ensures proprietary documents cannot be publicly scraped or linked permanently.
 * 
 * @param bucket - The Supabase storage bucket name
 * @param filePath - The specific path/name of the file in the bucket
 * @param expiresInSeconds - How long the URL remains valid (defaults to 1 hour)
 * @returns The temporary signed URL string
 */
export const generateSignedAssetUrl = async (
  bucket: string,
  filePath: string,
  expiresInSeconds: number = 3600
) => {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
};