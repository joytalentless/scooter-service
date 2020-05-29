import { Tier, Vehicle, Voi, Zvipp } from "./interfaces";

export function mapVoi(voiScooters: Voi[]): Vehicle[] {
    return voiScooters.map((v: Voi) => ({
        id: v.bike_id,
        operator: "voi",
        lat: v.lat,
        lon: v.lon,
        code: "-",
        battery: v.battery
    }));
}

export function mapTier(tierScooters: Tier[]): Vehicle[] {
    return tierScooters.map((t: Tier) => ({
        id: t.id,
        operator: "tier",
        lat: t.attributes.lat,
        lon: t.attributes.lng,
        code: t.attributes.code.toString(),
        battery: t.attributes.batteryLevel
    }));
}

export function mapZvipp(zvippScooters: Zvipp[]): Vehicle[] {
    return zvippScooters.map((z: Zvipp) => ({
        id: z.bike_id.toString(),
        operator: "zvipp",
        lat: Number(z.lat),
        lon: Number(z.lon),
        code: z["qr-code"],
        battery: z.battery
    }));
}
