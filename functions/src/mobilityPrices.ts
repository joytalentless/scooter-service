import * as functions from "firebase-functions";
import * as request from "superagent";
import {
    cityBikeStaticPrices,
    defaultScooterPrice,
    MILLIS_PER_MINUTE,
    scooterPrices,
} from "./utils/constants";
import {toggles} from "./utils/firebase";
import {formatPriceToText} from "./utils/formatters";
import {ScooterPrice} from "./utils/interfaces";
import {capitalizeFirstLetter, logError} from "./utils/logging";
import {Operator} from "./utils/operators";

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
        console.log(`${capitalizeFirstLetter(Operator.TIER)} is toggled off`);
        return defaultScooterPrice;
    }
    if (priceFetchedWithinLast30Minutes()) {
        return tier.prices;
    }

    try {
        const tierResponse: request.Response = await request
            .get(`${functions.config().tier.url.price}?zoneId=${zone}`)
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
        console.log(`Updated Scooter price from ${capitalizeFirstLetter(Operator.TIER)}.`);
        return tier.prices;
    } catch (err) {
        logError(Operator.TIER, err, "Failed to update price")
        return defaultScooterPrice;
    }
}
