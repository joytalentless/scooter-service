import { priceText, priceTexts, ScooterPrice } from "./interfaces";
import { formatPriceToText } from "./formatters";

export const CLIENT_HEADER_NAME: string = "ET-Client-Name";
export const CLIENT_ENTUR: string = "entur-client";
export const tierApiUrl = "https://platform.tier-services.io/v1/vehicle";
export const tierPricingApiUrl = "https://platform.tier-services.io/v1/pricing";
export const voiApiUrlOslo =
    "https://mds.voiapp.io/v1/gbfs/en/27/free_bike_status";
export const voiApiUrlTrondheim =
    "https://mds.voiapp.io/v1/gbfs/en/196/free_bike_status";
export const voiSessionKeyUrl = "https://mds.voiapp.io/token";
export const zvippApiUrlDrammen =
    "https://zvipp-api.joyridecity.bike/gbfs/en/free_bike_status.json?operator_id=67";
export const TIER_MAX_RANGE = 30000;
export const MILLIS_PER_MINUTE = 60000;

const osloBergenTrondheimCityBikeStaticPrice: priceText = {
    nob: "399 kr for sesongpass / 49 kr for dagspass",
    nno: "399 kr for sesongpass / 49 kr for dagspass",
    eng: "NOK 399 for season pass / NOK 49 for day pass"
};
export const cityBikeStaticPrices: priceTexts = {
    oslo: osloBergenTrondheimCityBikeStaticPrice,
    bergen: osloBergenTrondheimCityBikeStaticPrice,
    trondheim: osloBergenTrondheimCityBikeStaticPrice,
    drammen: {
        nob: "130 kr for sesongpass",
        nno: "130 kr for sesongpass",
        eng: "NOK 130 for season pass"
    },
    lillestrom: {
        eng: "NOK 50 for season pass / NOK 10 for 3-day pass",
        nob: "50 kr for sesongpass / 10 kr for 3-dagerskort",
        nno: "50 kr for sesongpass / 10 kr for 3-dagarskort"
    },
    kolumbus: {
        eng: "Free for one hour with a valid ticket",
        nob: "Gratis i én time med gyldig billett",
        nno: "Gratis i éin time med gyldig billett"
    }
};
export const defaultScooterPrice: ScooterPrice = {
    startPrice: 10,
    pricePerMinute: 2.5
};
export const scooterPrices: priceTexts = {
    voi: formatPriceToText(
        defaultScooterPrice.startPrice,
        defaultScooterPrice.pricePerMinute
    ),
    tier: formatPriceToText(
        defaultScooterPrice.startPrice,
        defaultScooterPrice.pricePerMinute
    ),
    zvipp: formatPriceToText(defaultScooterPrice.startPrice, 3)
};
