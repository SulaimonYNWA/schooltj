/**
 * Shared utility functions for the frontend.
 */

/**
 * Returns a human-readable "time ago" string for a given ISO date string.
 */
export function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

/**
 * Returns a human-readable "days until" string for a due date.
 */
export function daysUntil(dateStr: string): string {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
}

/**
 * Format currency in Tajik Somoni (TJS).
 */
export function formatTJS(amount: number): string {
    return `TJS ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}
