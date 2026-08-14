let activeCurrency = 'UGX';

export const setMoneyCurrency = (currency: string | undefined): void => {
    if (currency) {
        activeCurrency = currency.toUpperCase();
    }
};

export const money = (
    value: number | string | null | undefined,
    currency = activeCurrency,
): string =>
    new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency,
        currencyDisplay: 'code',
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
