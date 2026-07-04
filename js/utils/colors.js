// colors.js — Цвета стран

export const COUNTRY_COLORS = {
    germany: '#3a3a3a',
    ussr: '#990000',
    poland: '#ffc0cb',
    france: '#3b82f6',
    uk: '#ef4444',
    italy: '#166534',
    spain: '#fbbf24',
    portugal: '#105d10',
    netherlands: '#f97316',
    belgium: '#eab308',
    luxembourg: '#67e8f9',
    switzerland: '#dc2626',
    romania: '#eab308',
    hungary: '#166534',
    bulgaria: '#105d10',
    finland: '#ffffff',
    czechoslovakia: '#3b82f6',
    austria: '#ef4444',
    denmark: '#ef4444',
    greece: '#60a5fa',
    yugoslavia: '#1e3a8a',
    lithuania: '#065f46',
    latvia: '#8b0000',
    estonia: '#4682b4',
    slovakia: '#60a5fa',
    turkey: '#c8102e'
};

export function getCountryColor(countryId) {
    return COUNTRY_COLORS[countryId] || '#666666';
}
