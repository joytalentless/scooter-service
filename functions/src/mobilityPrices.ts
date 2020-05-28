import * as functions from "firebase-functions";
import * as request from "superagent";
import {
    cityBikeStaticPrices,
    defaultScooterPrice,
    MILLIS_PER_MINUTE,
    scooterPrices,
    tierPricingApiUrl
} from "./utils/constants";
import {toggles} from "./utils/firebase";
import {ScooterPrice} from "./utils/interfaces";
import {formatPriceToText} from "./utils/formatters";
import {logError} from "./utils/logging";

const EPOCH = new Date(0);

let tier = {
    prices: {
        startPrice: defaultScooterPrice.startPrice,
        pricePerMinute: defaultScooterPrice.pricePerMinute
    },
    lastFetched: EPOCH
};

const priceFetchedWithinLast30Minutes = () =>
    new Date().getTime() < tier.lastFetched.getTime() + 30 * MILLIS_PER_MINUTE

export const prices = functions
    .region("europe-west1")
    .https.onRequest(async (req, res) => {
        const tierPrices = await tierPrice();

        res.status(200).send({
            scooters: {
                ...scooterPrices,
                tier: formatPriceToText(
                    tierPrices.startPrice,
                    tierPrices.pricePerMinute
                )
            },
            cityBikes: cityBikeStaticPrices
        });
    });

async function tierPrice(zone: string = "OSLO"): Promise<ScooterPrice> {
    if (toggles().tier === "off") {
        console.log("Tier is toggled off");
        return defaultScooterPrice;
    }
    if (priceFetchedWithinLast30Minutes()) {
        return tier.prices;
    }

    try {
        const tierResponse: request.Response = await request
            .get(`${tierPricingApiUrl}?zoneId=${zone}`)
            .set("x-api-key", functions.config().tier.api.key);
        const {
            attributes: {rentalStartPrice, rentalRunningPricePerMinute}
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
        logError("Tier", err, "Failed to update price")
        return defaultScooterPrice;
    }
}
