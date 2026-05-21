// src/lib/formatters.ts

/**
 * Standardizes currency formatting across the ERP.
 * Ensures a $50,000 deal looks identical in the CRM and the Digital Marketplace.
 * 
 * @param amount - The raw numeric value
 * @param currency - The currency code (defaults to 'USD')
 * @returns A strictly formatted currency string (e.g., "$50,000.00")
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats ISO date strings into readable, temporal timestamps.
 * Critical for establishing an immutable, easy-to-read audit trail for legal compliance.
 * 
 * @param isoString - The raw ISO timestamp from the database
 * @returns Formatted string (e.g., "Oct 24, 2026, 10:30:00 AM EDT")
 */
export const formatAuditDate = (isoString: string): string => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(date);
};

/**
 * Generates 1-2 letter initials from a full name for user avatars.
 * 
 * @param name - Full name of the user
 * @returns Capitalized initials (e.g., "John Doe" -> "JD")
 */
export const generateInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};