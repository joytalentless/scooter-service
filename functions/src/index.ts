import * as functions from 'firebase-functions';
import * as request from 'superagent';

const OSLO = {
    lat: 59.913868,
    long: 10.752245
};

const voiApiUrl = 'https://api.voiapp.io/v1/vehicle/status/ready';
const tierApiUrl = 'https://platform.tier-services.io/v1/vehicle?zoneId=OSLO2';

interface Vehicle {
    id: string,
    operator: string,
    lat: number,
    lon: number,
    code: string,
    battery: number
}

interface Voi {
    id: string,
    location: number[],
    short: string,
    battery: number,
    zone: number
}

interface Tier {
    id: string;
    attributes: {
        lat: number,
        lng: number,
        code: number,
        batteryLevel: number
    }
}

export const nearbyVoi = functions.region('europe-west1').https.onRequest(async (req, res) => {
    try {
        const apiRes: request.Response = await request.get(
            `${voiApiUrl}?la=${OSLO.lat}&lo=${OSLO.long}`
        );
        const vehicles = JSON.parse(apiRes.text);
        const vehiclesOslo = vehicles.filter((v: Voi) => v.zone === 27);

        console.log(`Voi bikes in Oslo: ${vehiclesOslo.length}`);

        res.status(200).send(vehiclesOslo);
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});

export const nearbyTier = functions.region('europe-west1').https.onRequest(async (req, res) => {
    try {
        const apiRes: request.Response = await request
            .get(`${tierApiUrl}`)
            .set('x-api-key', functions.config().tier.api.key);
        const vehicles = JSON.parse(apiRes.text);

        console.log(`Tier bikes in Oslo: ${vehicles.data.length}`);

        res.status(200).send(vehicles);
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});

export const nearby = functions.region('europe-west1').https.onRequest(async (req, res) => {
    try {
        const voiResponse: request.Response = await request.get(
            `${voiApiUrl}?la=${OSLO.lat}&lo=${OSLO.long}`
        );
        const voiAll = JSON.parse(voiResponse.text);
        const voi = voiAll.filter((v: Voi) => v.zone === 27);

        const voiMapped: Vehicle[] = voi.map((v:Voi) => ({
            id: v.id,
            operator: 'voi',
            lat: v.location[0],
            lon: v.location[1],
            code: v.short,
            battery: v.battery
        }));

        const tierResponse: request.Response = await request
            .get(`${tierApiUrl}`)
            .set('x-api-key', functions.config().tier.api.key);

        const tier = JSON.parse(tierResponse.text).data;

        const tierMapped: Vehicle[] = tier.map((t:Tier) => ({
            id: t.id,
            operator: 'tier',
            lat: t.attributes.lat,
            lon: t.attributes.lng,
            code: t.attributes.code,
            battery: t.attributes.batteryLevel
        }));

        const vehicles = voiMapped.concat(tierMapped);

        console.log(`Scooters in Oslo: ${vehicles.length}`);
        res.status(200).send(vehicles);
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});