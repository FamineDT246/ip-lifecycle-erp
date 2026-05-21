// src/hooks/useStaleLead.ts
import { useMemo } from 'react';

/**
 * CRM pipeline logic that flags Kanban cards if they haven't been touched recently.
 * Drives action for the Sales team to prevent enterprise deals from going cold.
 * 
 * @param lastContactDate - ISO string of the last interaction
 * @param staleThresholdDays - Number of days before a lead is considered "stale" (default: 14)
 * @returns boolean indicating if the UI should highlight the card in red
 */
export function useStaleLead(lastContactDate: string, staleThresholdDays: number = 14): boolean {
  return useMemo(() => {
    if (!lastContactDate) return true;

    const lastContact = new Date(lastContactDate).getTime();
    const now = new Date().getTime();
    
    const differenceInMs = now - lastContact;
    const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);

    return differenceInDays > staleThresholdDays;
  }, [lastContactDate, staleThresholdDays]);
}