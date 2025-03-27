import { get } from 'svelte/store';
import { locale } from 'svelte-i18n';

export function formatPrice(price: number) {
    return new Intl.NumberFormat(get(locale) || 'pt-PT', { style: 'currency', currency: 'EUR' }).format(price);
} 