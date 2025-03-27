import { browser } from '$app/environment';
import { init, register, locale } from 'svelte-i18n';

const defaultLocale = 'pt';

register('en', () => import('./locales/en.json'));
register('pt', () => import('./locales/pt.json'));

init({
    fallbackLocale: defaultLocale,
    initialLocale: defaultLocale
});

// Handle locale loading and persistence
if (browser) {
    // Get stored locale from localStorage or use default
    const storedLocale = localStorage.getItem('preferred-locale') || defaultLocale;
    locale.set(storedLocale);
    
    // Subscribe to locale changes to persist them
    locale.subscribe((newLocale) => {
        if (newLocale) {
            localStorage.setItem('preferred-locale', newLocale);
        }
    });
} 