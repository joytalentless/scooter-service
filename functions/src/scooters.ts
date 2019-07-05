import * as functions from 'firebase-functions';
import * as request from 'superagent';

const CLIENT_HEADER_NAME: string = 'ET-Client-Name';
const CLIENT_ENTUR: string = 'entur-client-app';

const tierApiUrl = 'https://platform.tier-services.io/v1/vehicle?zoneId=OSLO';
const voiApiUrl = 'https://api.voiapp.io/v1/vehicles/zone/27/ready';
const voiSessionKeyUrl = 'https://api.voiapp.io/v1/auth/session/';
let voiSessionKey = '';
const zvippApiUrl = 'https://zvipp-api.joyridecity.bike/gbfs/en/free_bike_status.json?operator_id=60';

interface Vehicle {
    id: string
    operator: string
    lat: number
    lon: number
    code: string
    battery: number
}

interface Voi {
    id: string
    location: number[]
    short: string
    battery: number
}

interface Tier {
    id: string
    attributes: {
        lat: number
        lng: number
        code: number
        batteryLevel: number
    }
}

interface Zvipp {
    bike_id: number
    operator: string
    latitude: string
    longitude: string
    is_reserved: boolean
    is_disabled: boolean
    'qr-code': string
    battery: number

}

export const scooters = functions.region('europe-west1').https.onRequest(async (req, res) => {
    const lat: number = req.query.lat;
    const lon: number = req.query.lon;
    const range: number = req.query.range || 200;
    const max: number = req.query.max || 20;

    if (!lat || !lon) {
        res.status(422).send("Coordinates missing (lat and lon)");
        return;
    }

    logClientName(req.get(CLIENT_HEADER_NAME));

    try {
        const voiMapped: Vehicle[] = await getVoiScooters();
        const tierMapped: Vehicle[] = await getTierScooters(lat, lon, range);
        const zvippMapped: Vehicle[] = await getZvippScooters();

        const vehicles: Vehicle[] = new Array<Vehicle>().concat(voiMapped, tierMapped, zvippMapped);

        const closestVehicles: Vehicle[] = vehicles.sort((v1, v2) => {
            return distance(lat, lon, v1.lat, v1.lon) - distance(lat, lon, v2.lat, v2.lon)
        }).slice(0, max);

        console.log(`Scooters nearby (${lat}, ${lon}, range: ${range}, max: ${max}): ${closestVehicles.length}`);
        res.status(200).send(closestVehicles);
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});

export const nearby = scooters; // Alias for backwards compatibility

async function getTierScooters(lat?: number, lon?: number, range?: number) {
    let url: string = tierApiUrl;
    if (lat && lon && range) {
        url = `${tierApiUrl}&lat=${lat}&lng=${lon}&radius=${range}`;
    }

    try {
        const tierResponse: request.Response = await request
            .get(`${url}`)
            .set('x-api-key', functions.config().tier.api.key);
        const tier = JSON.parse(tierResponse.text).data;
        return mapTier(tier);
    } catch (err) {
        console.error(err);
        return [];
    }
}

async function getVoiScooters() {
    try {
        return await voiRequest();
    } catch (err) {
        if (err && err.status === 401) {
            try {
                await refreshVoiSessionKey();
                return await voiRequest();
            } catch (e) {
                console.error(e);
                return [];
            }
        } else {
            console.error(err);
            return [];
        }
    }
}

async function voiRequest() {
    try {
        const voiResponse: request.Response = await request
            .get(`${voiApiUrl}`)
            .set('X-Access-Token', voiSessionKey);
        const voi = JSON.parse(voiResponse.text);
        return mapVoi(voi);
    } catch (err) {
        throw err;
    }
}

async function refreshVoiSessionKey() {
    console.log("Refreshing VOI session key..");
    try {
        const res: request.Response = await request
            .post(`${voiSessionKeyUrl}`)
            .send({ authenticationToken: functions.config().voi.api.key });
        voiSessionKey = JSON.parse(res.text).accessToken;
    } catch (err) {
        console.error(err);
    }
}

async function getZvippScooters() {
    try {
        const zvippResponse: request.Response = await request
            .get(`${zvippApiUrl}`);
        const zvipp: Zvipp[] = JSON.parse(zvippResponse.text).data.en.bikes;
        return mapZvipp(zvipp.filter(z => !z.is_disabled && !z.is_reserved));
    } catch (err) {
        console.error(err);
        return [];
    }
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const p = 0.017453292519943295;    // Math.PI / 180
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p)) / 2;

    return 12742 * Math.asin(Math.sqrt(a)) * 1000; // 2 * R; R = 6371 km
}

function mapVoi(voiScooters: Voi[]): Vehicle[] {
    return voiScooters.map((v: Voi) => ({
        id: v.id,
        operator: 'voi',
        lat: v.location[0],
        lon: v.location[1],
        code: v.short,
        battery: v.battery
    }));
}

function mapTier(tierScooters: Tier[]): Vehicle[] {
    return tierScooters.map((t: Tier) => ({
        id: t.id,
        operator: 'tier',
        lat: t.attributes.lat,
        lon: t.attributes.lng,
        code: t.attributes.code.toString(),
        battery: t.attributes.batteryLevel
    }));
}

function mapZvipp(zvippScooters: Zvipp[]): Vehicle[] {
    return zvippScooters.map((z: Zvipp) => ({
        id: z.bike_id.toString(),
        operator: 'zvipp',
        lat: Number(z.latitude),
        lon: Number(z.longitude),
        code: z['qr-code'],
        battery: z.battery
    }));
}

function logClientName(client: string | undefined): void {
    if (!client) {
        console.log(`ET-Client-Name missing!`);
    }

    if (client && !client.startsWith(CLIENT_ENTUR)) {
        console.log(`ET-Client-Name: ${client}`);
    }
}
