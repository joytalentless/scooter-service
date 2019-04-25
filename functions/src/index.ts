import * as functions from 'firebase-functions';
import * as request from 'superagent';

const OSLO = {
    lat: 59.913868,
    long: 10.752245
};

const voiApiUrl = 'https://api.voiapp.io/v1/vehicle/status/ready';
const tierApiUrl = 'https://platform.tier-services.io/v1/vehicle?zoneId=OSLO';

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
        const apiRes: request.Response = await request
            .get(`${voiApiUrl}?la=${OSLO.lat}&lo=${OSLO.long}`
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

export const oslo = functions.region('europe-west1').https.onRequest(async (req, res) => {
    try {
        const voiResponse: request.Response = await request
            .get(`${voiApiUrl}?la=${OSLO.lat}&lo=${OSLO.long}`
        );
        const voiAll = JSON.parse(voiResponse.text);
        const voi = voiAll.filter((v: Voi) => v.zone === 27);
        const voiMapped: Vehicle[] = mapVoi(voi);

        const tierResponse: request.Response = await request
            .get(`${tierApiUrl}`)
            .set('x-api-key', functions.config().tier.api.key);
        const tier = JSON.parse(tierResponse.text).data;
        const tierMapped: Vehicle[] = mapTier(tier);

        const vehicles = voiMapped.concat(tierMapped);

        console.log(`Scooters in Oslo: ${vehicles.length}`);
        res.status(200).send(vehicles);
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});

export const nearby = functions.region('europe-west1').https.onRequest(async (req, res) => {
    const lat: number = req.query.lat;
    const lon: number = req.query.lon;
    const range: number = req.query.range || 100;

    if (lat === undefined || lon === undefined) {
        res.status(422).send("Coordinates missing (lat and lon)");
    }

    try {
        const voiResponse: request.Response = await request
            .get(`${voiApiUrl}?la=${OSLO.lat}&lo=${OSLO.long}`
        );
        const voiAll = JSON.parse(voiResponse.text);
        const voiOslo = voiAll.filter((v: Voi) => v.zone === 27);
        const voi = voiOslo.filter((v: Voi) => distance(lat, lon, v.location[0], v.location[1]) < range);
        const voiMapped: Vehicle[] = mapVoi(voi);

        const tierResponse: request.Response = await request
            .get(`${tierApiUrl}&lat=${lat}&lng=${lon}&radius=${range}`)
            .set('x-api-key', functions.config().tier.api.key);
        const tier = JSON.parse(tierResponse.text).data;
        const tierMapped: Vehicle[] = mapTier(tier);

        const vehicles = voiMapped.concat(tierMapped);

        console.log(`Scooters nearby (${lat}, ${lon}, range: ${range}): ${vehicles.length}`);
        res.status(200).send(vehicles);
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});

function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const p = 0.017453292519943295;    // Math.PI / 180
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p)/2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p))/2;

    return 12742 * Math.asin(Math.sqrt(a)) * 1000; // 2 * R; R = 6371 km
}

function mapVoi(voiScooters: Voi[]): Vehicle[] {
    return voiScooters.map((v:Voi) => ({
        id: v.id,
        operator: 'voi',
        lat: v.location[0],
        lon: v.location[1],
        code: v.short,
        battery: v.battery
    }));
}

function mapTier(tierScooters: Tier[]): Vehicle[] {
    return tierScooters.map((t:Tier) => ({
        id: t.id,
        operator: 'tier',
        lat: t.attributes.lat,
        lon: t.attributes.lng,
        code: t.attributes.code.toString(),
        battery: t.attributes.batteryLevel
    }));
}