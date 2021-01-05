import { priceText, priceTexts, ScooterPrice } from './interfaces'
import { formatPriceToText } from './formatters'

export const CLIENT_HEADER_NAME = 'ET-Client-Name'
export const CLIENT_ENTUR = 'entur-client'
export const TIER_MAX_RANGE = 30000
export const MILLIS_PER_MINUTE = 60000

const osloBergenTrondheimCityBikeStaticPrice: priceText = {
    nob: '399 kr for sesongpass / 49 kr for dagspass',
    nno: '399 kr for sesongpass / 49 kr for dagspass',
    eng: 'NOK 399 for season pass / NOK 49 for day pass',
}
export const cityBikeStaticPrices: priceTexts = {
    oslo: osloBergenTrondheimCityBikeStaticPrice,
    bergen: osloBergenTrondheimCityBikeStaticPrice,
    trondheim: osloBergenTrondheimCityBikeStaticPrice,
    drammen: {
        nob: '130 kr for sesongpass',
        nno: '130 kr for sesongpass',
        eng: 'NOK 130 for season pass',
    },
    lillestrom: {
        eng: 'NOK 50 for season pass / NOK 10 for 3-day pass',
        nob: '50 kr for sesongpass / 10 kr for 3-dagerskort',
        nno: '50 kr for sesongpass / 10 kr for 3-dagarskort',
    },
    kolumbus: {
        eng: 'Free for one hour with a valid ticket',
        nob: 'Gratis i én time med gyldig billett',
        nno: 'Gratis i éin time med gyldig billett',
    },
}
export const defaultScooterPrice: ScooterPrice = {
    startPrice: 10,
    pricePerMinute: 2.5,
}

export const boltOsloScooterPrice: ScooterPrice = {
    startPrice: 0,
    pricePerMinute: 3.5,
}

export const boltLillestromScooterPrice: ScooterPrice = {
    startPrice: 5,
    pricePerMinute: 2.5,
}

export const boltFredrikstadScooterPrice: ScooterPrice = {
    startPrice: 10,
    pricePerMinute: 2.5,
}

export const limeScooterPrice: ScooterPrice = {
    startPrice: 10,
    pricePerMinute: 3.0,
}

export const scooterPrices: priceTexts = {
    voi: formatPriceToText(
        defaultScooterPrice.startPrice,
        defaultScooterPrice.pricePerMinute,
    ),
    tier: formatPriceToText(
        defaultScooterPrice.startPrice,
        defaultScooterPrice.pricePerMinute,
    ),
    zvipp: formatPriceToText(defaultScooterPrice.startPrice, 3),
    bolt_oslo: formatPriceToText(
        boltOsloScooterPrice.startPrice,
        boltOsloScooterPrice.pricePerMinute,
    ),
    bolt_lillestrom: formatPriceToText(
        boltLillestromScooterPrice.startPrice,
        boltLillestromScooterPrice.pricePerMinute,
    ),
    bolt_fredrikstad: formatPriceToText(
        boltFredrikstadScooterPrice.startPrice,
        boltFredrikstadScooterPrice.pricePerMinute,
    ),
    lime: formatPriceToText(
        limeScooterPrice.startPrice,
        limeScooterPrice.pricePerMinute,
    ),
}
