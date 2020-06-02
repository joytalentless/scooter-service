import { Tier, Vehicle, Voi, Zvipp } from "./interfaces";
import {getNeTExId, Operator} from "./operators";

export function mapVoi(voiScooters: Voi[]): Vehicle[] {
    return voiScooters.map((v: Voi) => ({
        id: getNeTExId(v.bike_id, Operator.VOI),
        operator: Operator.VOI.toLowerCase(),
        lat: v.lat,
        lon: v.lon,
        code: "-",
        battery: v.battery
    }));
}

export function mapTier(tierScooters: Tier[]): Vehicle[] {
    return tierScooters.map((t: Tier) => ({
        id: getNeTExId(t.id, Operator.TIER),
        operator: Operator.TIER.toLowerCase(),
        lat: t.attributes.lat,
        lon: t.attributes.lng,
        code: t.attributes.code.toString(),
        battery: t.attributes.batteryLevel
    }));
}

export function mapZvipp(zvippScooters: Zvipp[]): Vehicle[] {
    return zvippScooters.map((z: Zvipp) => ({
        id: getNeTExId(z.bike_id.toString(), Operator.ZVIPP),
        operator: Operator.ZVIPP.toLowerCase(),
        lat: Number(z.lat),
        lon: Number(z.lon),
        code: z["qr-code"],
        battery: z.battery
    }));
}
