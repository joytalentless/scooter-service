export const formatDecimals = (price: number, locale: 'en' | 'no'): string => {
    const [integer, fraction] = price.toString().split('.')
    const withFraction = fraction && !/^0*$/.test(fraction)
    return withFraction
        ? [integer, fraction.padEnd(2, '0')].join(locale === 'en' ? '.' : ',')
        : integer
}

enum Locale {
    Bokmal = 'nob',
    Nynorsk = 'nno',
    English = 'eng',
}

type MultilingualString = Record<Locale, string>

export const formatPriceToText = (
    startPrice: number,
    pricePerMinute: number,
): MultilingualString => ({
    nob: `${formatDecimals(startPrice, 'no')} kr i oppstart + ${formatDecimals(
        pricePerMinute,
        'no',
    )} kr per min`,
    nno: `${formatDecimals(startPrice, 'no')} kr i oppstart + ${formatDecimals(
        pricePerMinute,
        'no',
    )} kr per min`,
    eng: `NOK ${formatDecimals(
        startPrice,
        'en',
    )} to unlock + NOK ${formatDecimals(pricePerMinute, 'en')} per min`,
})
