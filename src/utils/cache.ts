import { Operator } from './operators'
import { Vehicle } from './interfaces'
import { logError } from './logging'

const VEHICLE_CACHE_TTL_IN_MS = 10000

type VehicleCache = {
    lastFetched: Date | null
    isFetching: boolean
    fetcherPromise: Promise<Vehicle[]> | null
}

const cache: Record<Operator, VehicleCache> = {
    [Operator.VOI]: {
        lastFetched: null,
        isFetching: false,
        fetcherPromise: null,
    },
    [Operator.TIER]: {
        lastFetched: null,
        isFetching: false,
        fetcherPromise: null,
    },
    [Operator.ZVIPP]: {
        lastFetched: null,
        isFetching: false,
        fetcherPromise: null,
    },
    [Operator.LIME]: {
        lastFetched: null,
        isFetching: false,
        fetcherPromise: null,
    },
    [Operator.BOLT]: {
        lastFetched: null,
        isFetching: false,
        fetcherPromise: null,
    },
}

const expired = (lastFetched: Date | null) =>
    lastFetched === null ||
    lastFetched!.getTime() + VEHICLE_CACHE_TTL_IN_MS < new Date().getTime()

export async function getCachedScooters(
    operator: Operator,
    fetchVehicles: () => Promise<Vehicle[]>,
) {
    const vehicleCache = cache[operator]

    if (
        !vehicleCache.fetcherPromise ||
        (expired(vehicleCache.lastFetched) && !vehicleCache.isFetching)
    ) {
        vehicleCache.isFetching = true
        vehicleCache.fetcherPromise = fetchVehicles()
            .then((freshVehicles) => {
                vehicleCache.isFetching = false
                vehicleCache.lastFetched = new Date()
                return freshVehicles
            })
            .catch((e) => {
                logError(operator, e, `error hydrating vehicle cache`)
                return []
            })
    }

    return await vehicleCache.fetcherPromise!
}
