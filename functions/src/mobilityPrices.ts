import * as functions from 'firebase-functions';

interface priceText {
    nob: string,
    nno: string,
    eng: string
}

interface priceTexts {
    [key: string]: priceText
}

const scooterPrices: priceTexts = {
    voi: {
        nob: '10 kr i oppstart + 3 kr per min',
        nno: '10 kr i oppstart + 3 kr per min',
        eng: 'NOK 10 to unlock + NOK 3 per min'
    },
    tier: {
        nob: '10 kr i oppstart + 1,90 kr per min',
        nno: '10 kr i oppstart + 1,90 kr per min',
        eng: 'NOK 10 to unlock + NOK 1.90 per min'
    }
};

const osloBergenTrondheim: priceText = {
    nob: '399 kr for sesongpass / 49 kr for dagspass',
    nno: '399 kr for sesongpass / 49 kr for dagspass',
    eng: 'NOK 399 for season pass / NOK 49 for day pass'
};

const cityBikePrices: priceTexts = {
    oslo: osloBergenTrondheim,
    bergen: osloBergenTrondheim,
    trondheim: osloBergenTrondheim,
    drammen: {
        nob: '130 kr for sesongpass',
        nno: '130 kr for sesongpass',
        eng: 'NOK 130 for season pass'
    },
    lillestrom: {
        eng: 'NOK 50 for season pass / NOK 10 for 3-day pass',
        nob: '50 kr for sesongpass / 10 kr for 3-dagerskort',
        nno: 'NOK 50 for sesongpass / NOK 10 for 3-dagarskort'
    }
};

export const scooterPriceText = functions.region('europe-west1').https.onRequest(async (req, res) => {
    res.status(200).send(scooterPrices);
});

export const cityBikePriceText = functions.region('europe-west1').https.onRequest(async (req, res) => {
    res.status(200).send(cityBikePrices)
});

export const prices = functions.region('europe-west1').https.onRequest(async (req, res) => {
    res.status(200).send({scooters: scooterPrices, cityBikes: cityBikePrices});
});
