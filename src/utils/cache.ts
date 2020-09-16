import { Operator } from "./operators";
import { Vehicle } from "./interfaces";
import { logError } from "./logging";

const VEHICLE_CACHE_TTL_IN_MS = 10000;

type VehicleCache = {
    lastFetched: Date | null,
    isFetching: boolean,
    vehicles: Vehicle[] | null
}

const cache: Record<Operator, VehicleCache> = {
    [Operator.VOI]: { lastFetched: null, isFetching: false, vehicles: null},
    [Operator.TIER]: { lastFetched: null, isFetching: false, vehicles: null},
    [Operator.ZVIPP]: { lastFetched: null, isFetching: false, vehicles: null},
    [Operator.LIME]: { lastFetched: null, isFetching: false, vehicles: null},
};

export function getCachedScooters(operator: Operator, fetchVehicles: () => Promise<Vehicle[]>) {
    const vehicleCache = cache[operator];

    // not possible to cache TIER without a spatial index
    if (operator === Operator.TIER) {
      return fetchVehicles();
    }

    if (vehicleCache.vehicles === null) {

        if (vehicleCache.isFetching) {
            return [];
        }

        vehicleCache.isFetching = true;
        return fetchVehicles().then(freshVehicles => {
            vehicleCache.vehicles = freshVehicles || [];
            vehicleCache.lastFetched = new Date();
            vehicleCache.isFetching = false;
            return freshVehicles;
        }).catch(e => {
            logError(operator, `error hydrating vehicle cache: ${e}`);
            vehicleCache.isFetching = false;
            return [];
        });
    }

    if (vehicleCache.lastFetched!.getTime() + VEHICLE_CACHE_TTL_IN_MS < new Date().getTime() && !vehicleCache.isFetching) {
        vehicleCache.isFetching = true;
        fetchVehicles().then(freshVehicles => {
            vehicleCache.vehicles = freshVehicles || [];
            vehicleCache.lastFetched = new Date();
            vehicleCache.isFetching = false;
        }).catch(e => {
            logError(operator, `error refetching vehicle cache: ${e}`);
            vehicleCache.isFetching = false;
        });
    }

    return vehicleCache.vehicles;
}
