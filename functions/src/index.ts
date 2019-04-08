import * as functions from 'firebase-functions';
import * as request from 'superagent';
import * as R from 'ramda';

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
    battery: number
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

export const nearbyVOI = functions.https.onRequest(async (req, res) => {
    try {
        const apiRes: request.Response = await request.get(
            `${voiApiUrl}?la=${OSLO.lat}&lo=${OSLO.long}`
        );
        const vehicles = JSON.parse(apiRes.text);

        const oslo = R.filter(
            (it: any) =>
                R.contains('59.', R.toString(R.prop('location', it)[0])) &&
                R.contains('10.', R.toString(R.prop('location', it)[1])),
            vehicles
        );

        console.log(`Voi bikes in Oslo ${R.length(oslo)}`);

        res.status(200).send(oslo);
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});

export const nearbyTier = functions.https.onRequest(async (req, res) => {
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

export const nearby = functions.https.onRequest(async (req, res) => {
    try {
        const voiResponse: request.Response = await request.get(
            `${voiApiUrl}?la=${OSLO.lat}&lo=${OSLO.long}`
        );
        const voiAll = JSON.parse(voiResponse.text);

        const voi = R.filter(
            (it: any) =>
                R.contains('59.', R.toString(R.prop('location', it)[0])) &&
                R.contains('10.', R.toString(R.prop('location', it)[1])),
            voiAll
        );

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

        const vehicles = R.union(voiMapped, tierMapped);

        console.log(`Scooters in Oslo: ${vehicles.length}`);
        res.status(200).send(vehicles);
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});