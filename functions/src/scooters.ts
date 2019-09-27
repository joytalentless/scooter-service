import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as request from 'superagent';

const CLIENT_HEADER_NAME: string = 'ET-Client-Name';
const CLIENT_ENTUR: string = 'entur-client-app';

const tierApiUrl = 'https://platform.tier-services.io/v1/vehicle?zoneId=OSLO';
const voiApiUrl = 'https://mds.voiapp.io/v1/gbfs/en/27/free_bike_status';
const voiSessionKeyUrl = 'https://mds.voiapp.io/token';
let voiSessionKey = '';
const zvippApiUrlOslo = 'https://zvipp-api.joyridecity.bike/gbfs/en/free_bike_status.json?operator_id=60';
const zvippApiUrlDrammen = 'https://zvipp-api.joyridecity.bike/gbfs/en/free_bike_status.json?operator_id=67';

interface Vehicle {
    id: string
    operator: string
    lat: number
    lon: number
    code: string
    battery: number
}

interface Voi {
    bike_id: string
    lat: number
    lon: number
    is_reserved: boolean
    is_disabled: boolean
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
    lat: string
    lon: string
    is_reserved: boolean
    is_disabled: boolean
    'qr-code': string
    battery: number
}

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

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
        const vehicles: Vehicle[] = await getScooters(lat, lon, range);
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

async function getScooters(lat: number, lon: number, range: number) {
    const voiMapped: Vehicle[] = await getVoiScooters();
    const tierMapped: Vehicle[] = await getTierScooters(lat, lon, range);
    const zvippMapped: Vehicle[] = await getZvippScooters();

    return new Array<Vehicle>().concat(voiMapped, tierMapped, zvippMapped);
}

export const nearby = scooters; // Alias for backwards compatibility

export const bigDataDump = functions.region('europe-west1').pubsub.schedule('every 1 hours').onRun(async () => {
    if (toggles().bigdatadump === 'on') {
        const allScooters: Vehicle[] = await getScooters(59.9, 10.7, 10000);
        console.log(`Number of scooters: ${allScooters.length}`);
        const data = allScooters.map(s => ({operator: s.operator, lat: s.lat, lon: s.lon}));

        const entry = db.collection('scooters').doc(new Date().toISOString());
        await entry.set({data});
    } else {
        console.log('BigDataDump is off')
    }
});

async function getTierScooters(lat?: number, lon?: number, range?: number) {
    if (toggles().tier === 'off') {
        console.log('Tier is toggled off');
        return [];
    }

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
    if (toggles().voi === 'off') {
        console.log('Voi is toggled off');
        return [];
    }

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
            .set('Authorization', `Bearer ${voiSessionKey}`)
            .set('Accept', 'application/vnd.mds.provider+json;version=0.3');
        const voi: Voi[] = JSON.parse(voiResponse.text).data.bikes;
        return mapVoi(voi.filter(v => !v.is_disabled && !v.is_reserved));
    } catch (err) {
        throw err;
    }
}

async function refreshVoiSessionKey() {
    console.log("Refreshing VOI session key..");
    try {
        const res: request.Response = await request
            .post(`${voiSessionKeyUrl}`)
            .auth(functions.config().voi.api.user, functions.config().voi.api.pass)
            .set('Accept', 'application/vnd.mds.provider+json;version=0.3')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send('grant_type=client_credentials');
        voiSessionKey = JSON.parse(res.text).access_token;
    } catch (err) {
        console.error(err);
    }
}

async function getZvippScooters() {
    if (toggles().zvipp === 'off') {
        console.log('Zvipp is toggled off');
        return [];
    }

    try {
        const zvippOsloResponse: request.Response = await request
            .get(`${zvippApiUrlOslo}`);
        const zvippOslo: Zvipp[] = JSON.parse(zvippOsloResponse.text).data.bikes;

        const zvippDrammenResponse: request.Response = await request
            .get(`${zvippApiUrlDrammen}`);
        const zvippDrammen: Zvipp[] = JSON.parse(zvippDrammenResponse.text).data.bikes;

        return mapZvipp(zvippOslo.concat(zvippDrammen).filter(z => !z.is_disabled && !z.is_reserved));
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
        id: v.bike_id,
        operator: 'voi',
        lat: v.lat,
        lon: v.lon,
        code: '-',
        battery: 70
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
        lat: Number(z.lat),
        lon: Number(z.lon),
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

function toggles() {
    return functions.config().toggles || {}
}
