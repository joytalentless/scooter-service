import * as functions from "firebase-functions";
import * as request from "superagent";

const MILLIS_PER_MINUTE = 60000;
const EPOCH = new Date(0);

interface priceText {
    nob: string;
    nno: string;
    eng: string;
}

interface priceTexts {
    [key: string]: priceText;
}

interface ScooterPrice {
    startPrice: number;
    pricePerMinute: number;
}

const defaultPrice = {
    startPrice: 10,
    pricePerMinute: 2.5
};

const tierApiUrl = "https://platform.tier-services.io/v1/pricing";
let tier = {
    prices: {
        startPrice: defaultPrice.startPrice,
        pricePerMinute: defaultPrice.pricePerMinute
    },
    lastFetched: EPOCH
};

const formatDecimals = (price: number, locale: "en" | "no") => {
    const [integer, fraction] = price.toString().split(".");
    const withFraction = fraction && !/^0*$/.test(fraction);
    return withFraction
        ? [integer, fraction.padEnd(2, "0")].join(locale === "en" ? "." : ",")
        : integer;
};

function priceToText(startPrice: number, pricePerMinute: number) {
    return {
        nob: `${formatDecimals(startPrice, "no")} kr i oppstart + ${formatDecimals(
            pricePerMinute,
            "no"
        )} kr per min`,
        nno: `${formatDecimals(startPrice, "no")} kr i oppstart + ${formatDecimals(
            pricePerMinute,
            "no"
        )} kr per min`,
        eng: `NOK ${formatDecimals(startPrice, "en")} to unlock + NOK ${formatDecimals(
            pricePerMinute,
            "en"
        )} per min`
    };
}

const scooterPrices: priceTexts = {
    voi: priceToText(defaultPrice.startPrice, defaultPrice.pricePerMinute),
    tier: priceToText(defaultPrice.startPrice, defaultPrice.pricePerMinute),
    zvipp: priceToText(defaultPrice.startPrice, 3)
};

const osloBergenTrondheim: priceText = {
    nob: "399 kr for sesongpass / 49 kr for dagspass",
    nno: "399 kr for sesongpass / 49 kr for dagspass",
    eng: "NOK 399 for season pass / NOK 49 for day pass"
};

const cityBikePrices: priceTexts = {
    oslo: osloBergenTrondheim,
    bergen: osloBergenTrondheim,
    trondheim: osloBergenTrondheim,
    drammen: {
        nob: "130 kr for sesongpass",
        nno: "130 kr for sesongpass",
        eng: "NOK 130 for season pass"
    },
    lillestrom: {
        eng: "NOK 50 for season pass / NOK 10 for 3-day pass",
        nob: "50 kr for sesongpass / 10 kr for 3-dagerskort",
        nno: "50 kr for sesongpass / 10 kr for 3-dagarskort"
    }
};

export const prices = functions
    .region("europe-west1")
    .https.onRequest(async (req, res) => {
        const tierPrices = await tierPrice();

        res.status(200).send({
            scooters: {
                ...scooterPrices,
                tier: priceToText(
                    tierPrices.startPrice,
                    tierPrices.pricePerMinute
                )
            },
            cityBikes: cityBikePrices
        });
    });

async function tierPrice(zone: string = "OSLO"): Promise<ScooterPrice> {
    if (toggles().tier === "off") {
        console.log("Tier is toggled off");
        return defaultPrice;
    }
    if (priceFetchedWithinLast30Minutes()) {
        return tier.prices;
    }

    let url: string = `${tierApiUrl}?zoneId=${zone}`;

    try {
        const tierResponse: request.Response = await request
            .get(`${url}`)
            .set("x-api-key", functions.config().tier.api.key);
        const {
            attributes: { rentalStartPrice, rentalRunningPricePerMinute }
        } = JSON.parse(tierResponse.text).data;

        tier = {
            prices: {
                startPrice: rentalStartPrice,
                pricePerMinute: rentalRunningPricePerMinute
            },
            lastFetched: new Date()
        };
        console.log("Updated Scooter price from Tier.");
        return tier.prices;
    } catch (err) {
        console.error(err);
        return defaultPrice;
    }
}

function priceFetchedWithinLast30Minutes() {
    return (
        new Date().getTime() <
        tier.lastFetched.getTime() + 30 * MILLIS_PER_MINUTE
    );
}

function toggles() {
    return functions.config().toggles || {};
}
