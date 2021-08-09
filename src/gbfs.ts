/**
 * Temporary endpoint to convert GBFS v1 feeds to v2.1
 *
 * This endpoint exists solely to have real data to develop
 * mobility v2 api against, and should not be used by external
 * parties.
 *
 * The duplication of code in this file is therefore intentional,
 * to avoid coupling with the rest of the codebase as much as possible
 *
 */
import * as functions from 'firebase-functions'
import { warn } from 'firebase-functions/lib/logger'
import * as request from 'superagent'
import * as express from 'express'
import { logError } from './utils/logging'
import { Operator } from './utils/operators'
import {
    boltOsloScooterPrice,
    boltFredrikstadScooterPrice,
    boltLillestromScooterPrice,
    boltBergenScooterPrice,
    defaultScooterPrice,
    limeScooterPrice,
} from './utils/constants'
import { ScooterPrice } from './utils/interfaces'
import { formatDecimals } from './utils/formatters'

enum Provider {
    voioslo = 'voioslo',
    voitrondheim = 'voitrondheim',
    limeoslo = 'limeoslo',
    boltoslo = 'boltoslo',
    boltlillestrom = 'boltlillestrom',
    boltfredrikstad = 'boltfredrikstad',
    boltbergen = 'boltbergen',
    moveabout = 'moveabout',
    tierasane = 'tierasane',
    tierasker = 'tierasker',
    tierbaerum = 'tierbaerum',
    tierbergen = 'tierbergen',
    tierdrammen = 'tierdrammen',
    tierhaugesund = 'tierhaugesund',
    tierlillestrom = 'tierlillestrom',
    tierlorenskog = 'tierlorenskog',
    tiernamsos = 'tiernamsos',
    tieroslo = 'tieroslo',
    tierski = 'tierski',
    tierstavanger = 'tierstavanger',
    tiertrondheim = 'tiertrondheim',
}

enum FeedName {
    gbfs = 'gbfs',
    gbfs_versions = 'gbfs_versions',
    system_information = 'system_information',
    vehicle_types = 'vehicle_types',
    station_information = 'station_information',
    station_status = 'station_status',
    free_bike_status = 'free_bike_status',
    system_hours = 'system_hours',
    system_calendar = 'system_calendar',
    system_regions = 'system_regions',
    system_pricing_plans = 'system_pricing_plans',
    system_alerts = 'system_alerts',
    geofencing_zones = 'geofencing_zones',
}

const app = express()

const lastUpdated = new Date().getTime()

app.get(
    '/:provider/:original?/:feed.:ext?',
    async (req, res): Promise<void> => {
        const hostname = req.hostname
        const { provider: providerString, feed: feedString } = req.params

        if (!isProviderName(providerString) || !isFeedName(feedString)) {
            res.sendStatus(404)
            return
        }

        const provider = <keyof typeof Provider>providerString
        const feed = <keyof typeof FeedName>feedString

        if (req.params.original) {
            const feedUrl = getFeedUrl(provider, feed)
            const bearerToken = await getBearerToken(provider)
            try {
                const feedResponse = await getFeed(
                    provider,
                    feedUrl,
                    bearerToken,
                )
                res.status(200).send(feedResponse)
            } catch (e) {
                res.status(404).send()
            }

            return
        }

        if (feed == FeedName.gbfs && !isTier(provider)) {
            res.status(200).send(getDiscoveryFeed(hostname, provider))
        } else if (
            feed === FeedName.vehicle_types &&
            provider !== Provider.limeoslo &&
            !isTier(provider)
        ) {
            res.status(200).send(getVehicleTypesFeed(provider))
        } else if (feed === FeedName.system_pricing_plans) {
            res.status(200).send(getSystemPricingPlansFeed(provider))
        } else {
            try {
                const feedUrl = getFeedUrl(provider, feed)
                const bearerToken = await getBearerToken(provider)
                const feedResponse = await getFeed(
                    provider,
                    feedUrl,
                    bearerToken,
                )
                const mappedFeed = mapFeed(
                    hostname,
                    provider,
                    feed,
                    feedResponse,
                )
                res.status(200).send(mappedFeed)
            } catch (e) {
                warn('Error caught while processing feed', {
                    provider,
                    feed,
                    error: e.stack,
                })
                res.status(500).send('Server error')
            }
        }
    },
)

function mapFeed<
    T extends keyof typeof Provider,
    S extends keyof typeof FeedName
>(hostname: string, provider: T, feed: S, feedResponse: string): GBFSBase {
    switch (feed) {
        case FeedName.gbfs:
            return mapDiscoveryFeed(hostname, provider, feedResponse)
        case FeedName.system_information:
            return mapSystemInformationFeed(provider, feedResponse)
        case FeedName.vehicle_types:
            return mapVehicleTypesFeed(provider, feedResponse)
        case FeedName.free_bike_status:
            return mapFreeBikeStatusFeed(provider, feedResponse)
        case FeedName.geofencing_zones:
            return mapGeofencingZones(provider, feedResponse)
        case FeedName.system_pricing_plans:
            return getSystemPricingPlansFeed(provider)
        default:
            throw new Error('Unknown feed')
    }
}

function getDiscoveryFeed<T extends keyof typeof Provider>(
    hostname: string,
    provider: T,
    feedUrl?: string,
): GBFS {
    const baseUrl = getBaseUrl(hostname)
    const optionalFeeds: Feed[] = []

    if (provider === Provider.limeoslo) {
        optionalFeeds.push({
            name: 'geofencing_zones',
            url: `${baseUrl}/gbfs-v2_2/${provider}/geofencing_zones`,
        })
    }

    return {
        last_updated: lastUpdated,
        ttl: 300,
        version: '2.2',
        data: {
            nb: {
                feeds: [
                    {
                        name: 'system_information',
                        url: `${baseUrl}/gbfs-v2_2/${provider}/system_information`,
                    },
                    {
                        name: 'vehicle_types',
                        url: `${baseUrl}/gbfs-v2_2/${provider}/vehicle_types`,
                    },
                    {
                        name: 'free_bike_status',
                        url: `${baseUrl}/gbfs-v2_2/${provider}/free_bike_status`,
                    },
                    {
                        name: 'system_pricing_plans',
                        url: `${baseUrl}/gbfs-v2_2/${provider}/system_pricing_plans`,
                    },
                    ...optionalFeeds,
                ],
            },
        },
    }
}

function mapDiscoveryFeed<T extends keyof typeof Provider>(
    hostname: string,
    provider: T,
    feedResponse: string,
): GBFS {
    const baseUrl = getBaseUrl(hostname)

    const {
        last_updated,
        data: {
            en: { feeds },
        },
    }: GBFS = JSON.parse(feedResponse)

    return {
        last_updated,
        ttl: 300,
        version: '2.2',
        data: {
            nb: {
                feeds: feeds.filter(filterFeeds).map((feed) => ({
                    name: feed.name,
                    url: `${baseUrl}/gbfs-v2_2/${provider}/${feed.name}`,
                })),
            },
        },
    }
}

function filterFeeds(feed: Feed) {
    return [
        FeedName.system_information,
        FeedName.vehicle_types,
        FeedName.free_bike_status,
        FeedName.system_pricing_plans,
        FeedName.geofencing_zones,
    ].includes(feed.name as FeedName)
}

function getBaseUrl(hostname: string) {
    let baseUrl
    if (hostname === 'localhost') {
        baseUrl = 'http://localhost:5001/entur-mobility-staging/europe-west1'
    } else if (hostname.includes('staging')) {
        baseUrl = 'https://api.staging.entur.io/mobility/v1'
    } else {
        baseUrl = 'https://api.entur.io/mobility/v1'
    }
    return baseUrl
}

function mapSystemInformationFeed<T extends keyof typeof Provider>(
    provider: T,
    feedResponse: string,
): SystemInformation {
    const {
        last_updated,
        data: { system_id, name, url, timezone, rental_apps },
    }: SystemInformation = JSON.parse(feedResponse)
    const systemId = getSystemId(provider, system_id)

    return {
        last_updated,
        ttl: 300,
        version: '2.2',
        data: {
            system_id: systemId,
            language: 'nb',
            name,
            url,
            timezone,
            rental_apps: rental_apps ? rental_apps : null,
        },
    }
}

function getVehicleTypesFeed<T extends keyof typeof Provider>(
    provider: T,
): VehicleTypes {
    const codespace = getCodespace(provider)

    return {
        last_updated: lastUpdated,
        ttl: 300,
        version: '2.2',
        data: {
            vehicle_types: [
                {
                    vehicle_type_id: `${codespace}:VehicleType:Scooter`,
                    form_factor: 'scooter',
                    propulsion_type: 'electric',
                    max_range_meters: 0,
                },
            ],
        },
    }
}

function mapVehicleTypesFeed<T extends keyof typeof Provider>(
    provider: T,
    feedResponse: string,
): VehicleTypes {
    const vehicleTypes: VehicleTypes = JSON.parse(feedResponse)
    const codespace = getCodespace(provider)
    return {
        last_updated: vehicleTypes.last_updated,
        ttl: 300,
        version: '2.2',
        data: {
            vehicle_types: vehicleTypes.data.vehicle_types.map(
                (vehicleType) => {
                    return {
                        vehicle_type_id: `${codespace}:VehicleType:${vehicleType.vehicle_type_id}`,
                        form_factor: vehicleType.form_factor,
                        propulsion_type: vehicleType.propulsion_type,
                        max_range_meters: vehicleType.max_range_meters || 0,
                        name: vehicleType.name || undefined,
                    }
                },
            ),
        },
    }
}

function mapFreeBikeStatusFeed<T extends keyof typeof Provider>(
    provider: T,
    feedResponse: string,
): FreeBikeStatus {
    const freeBikeStatus: FreeBikeStatus = JSON.parse(feedResponse)
    const codespace = getCodespace(provider)
    const pricingPlanId = getSystemPricingPlanId(provider, codespace)

    let bikes = freeBikeStatus.data.bikes

    // Note: VOI seems to have a bug in their system that sends duplicates of vehicles
    // when they have just been reserved. The following code section makes sure that
    // the vehicle that is actually marked as reserved is the one that is exposed by
    // the proxied feed. VOI has been notified of the issue.
    if (isVoi(provider)) {
        bikes = Object.values(
            bikes.reduce((acc: Record<string, Bike>, current: Bike) => {
                if (acc[current.bike_id]) {
                    console.log(
                        'Found duplicate voi scooter ' + current.bike_id,
                    )
                    if (current.is_reserved) {
                        acc[current.bike_id] = current
                    }
                } else {
                    acc[current.bike_id] = current
                }
                return acc
            }, {}),
        )
    }

    return {
        last_updated: freeBikeStatus.last_updated,
        ttl: 300,
        version: '2.2',
        data: {
            bikes: bikes.map((bike: any) => ({
                bike_id: `${codespace}:Vehicle:${bike.bike_id}`,
                lat: bike.lat,
                lon: bike.lon,
                is_reserved: bike.is_reserved === 1,
                is_disabled: bike.is_disabled === 1,
                vehicle_type_id: `${codespace}:VehicleType:${
                    bike.vehicle_type_id || 'Scooter'
                }`,
                current_range_meters: bike.current_range_meters || 0,
                pricing_plan_id:
                    bike.pricing_plan_id && !isTier(provider)
                        ? `${codespace}:PricingPlan:${bike.pricing_plan_id}`
                        : pricingPlanId,
                last_reported: bike.last_reported || null,
                station_id: bike.station_id
                    ? `${codespace}:Station:${bike.station_id}`
                    : null,
                rental_uris: bike.rental_uris ? bike.rental_uris : null,
            })),
        },
    }
}

function mapGeofencingZones<T extends keyof typeof Provider>(
    provider: T,
    feedResponse: string,
): GeofencingZones {
    const geofencingZones: GeofencingZones = JSON.parse(feedResponse)
    return {
        last_updated: geofencingZones.last_updated,
        ttl: 300,
        version: '2.2',
        data: {
            geofencing_zones: {
                type: 'FeatureCollection',
                features: geofencingZones.data.geofencing_zones.features.map(
                    (feature: Feature) => ({
                        ...feature,
                        properties: {
                            rules: feature.properties.rules,
                        },
                    }),
                ),
            },
        },
    }
}

function isVoi<T extends keyof typeof Provider>(provider: T): boolean {
    return provider === Provider.voioslo || provider === Provider.voitrondheim
}

function isTier<T extends keyof typeof Provider>(provider: T): boolean {
    return [
        Provider.tierasane,
        Provider.tierasker,
        Provider.tierbaerum,
        Provider.tierbergen,
        Provider.tierdrammen,
        Provider.tierhaugesund,
        Provider.tierlillestrom,
        Provider.tierlorenskog,
        Provider.tiernamsos,
        Provider.tieroslo,
        Provider.tierski,
        Provider.tierstavanger,
        Provider.tiertrondheim,
    ].includes(provider as Provider)
}

function getSystemPricingPlansFeed<T extends keyof typeof Provider>(
    provider: T,
): SystemPricingPlans {
    const codespace = getCodespace(provider)
    const { startPrice, pricePerMinute }: ScooterPrice = getSystemPricing(
        provider,
    )
    const planId = getSystemPricingPlanId(provider, codespace)

    const description = `${formatDecimals(
        startPrice,
        'no',
    )} kr + ${formatDecimals(pricePerMinute, 'no')} kr / min`

    return {
        last_updated: lastUpdated,
        ttl: 300,
        version: '2.2',
        data: {
            plans: [
                {
                    plan_id: planId,
                    name: 'Basic',
                    currency: 'NOK',
                    price: startPrice,
                    is_taxable: false,
                    description,
                    per_min_pricing: [
                        {
                            start: 0,
                            rate: pricePerMinute,
                            interval: 1,
                        },
                    ],
                },
            ],
        },
    }
}

function getSystemPricing<T extends keyof typeof Provider>(
    provider: T,
): ScooterPrice {
    switch (provider) {
        case Provider.boltoslo:
            return boltOsloScooterPrice
        case Provider.boltfredrikstad:
            return boltFredrikstadScooterPrice
        case Provider.boltlillestrom:
            return boltLillestromScooterPrice
        case Provider.boltbergen:
            return boltBergenScooterPrice
        case Provider.limeoslo:
            return limeScooterPrice
        default:
            return defaultScooterPrice
    }
}

function getCodespace<T extends keyof typeof Provider>(provider: T): string {
    if (isVoi(provider)) {
        return 'YVO'
    }

    if (isTier(provider)) {
        return 'YTI'
    }

    switch (provider) {
        case Provider.limeoslo:
            return 'YLI'
        case Provider.boltoslo:
        case Provider.boltfredrikstad:
        case Provider.boltlillestrom:
        case Provider.boltbergen:
            return 'YBO'
        case Provider.moveabout:
            return 'YMO'
        default:
            throw new Error('Unknown provider')
    }
}

function getSystemId<T extends keyof typeof Provider>(
    provider: T,
    system_id: string | undefined,
): string {
    const codespace = getCodespace(provider)
    return `${codespace}:System:${system_id || provider}`
}

function getSystemPricingPlanId<T extends keyof typeof Provider>(
    provider: T,
    codespace: string,
): string {
    let id = `${codespace}:PricingPlan:Basic`

    if (codespace === 'YBO') {
        id = `${codespace}:PricingPlan:${provider}`
    }

    return id
}

function isProviderName(name: string): name is Provider {
    return name in Provider
}

function isFeedName(name: string): name is FeedName {
    return name in FeedName
}

function getFeedUrl<
    T extends keyof typeof Provider,
    S extends keyof typeof FeedName
>(provider: T, feed: S): string {
    if (isTier(provider)) {
        return getTierFeedUrl(provider, feed)
    }

    switch (provider) {
        case Provider.voioslo:
            return functions
                .config()
                .voi.url.oslo.replace('free_bike_status', feed)
        case Provider.voitrondheim:
            return functions
                .config()
                .voi.url.trondheim.replace('free_bike_status', feed)
        case Provider.limeoslo:
            return functions
                .config()
                .lime.url.oslo_v2.replace('free_bike_status', feed)
        case Provider.boltoslo:
            return functions
                .config()
                .bolt.url.oslo.replace('free_bike_status', feed)
        case Provider.boltfredrikstad:
            return functions
                .config()
                .bolt.url.fredrikstad.replace('free_bike_status', feed)
        case Provider.boltlillestrom:
            return functions
                .config()
                .bolt.url.lillestrom.replace('free_bike_status', feed)
        case Provider.boltbergen:
            return functions
                .config()
                .bolt.url.bergen.replace('free_bike_status', feed)
        case Provider.moveabout:
            return functions.config().moveabout.url + feed + '.json'
        default:
            throw new Error('Unknown provider')
    }
}

function getTierFeedUrl<
    T extends keyof typeof Provider,
    S extends keyof typeof FeedName
>(provider: T, feed: S) {
    switch (feed) {
        case FeedName.gbfs:
            return functions
                .config()
                .tier.url.gbfs.replace(
                    '%LOCATION%',
                    provider.replace('tier', '').toUpperCase(),
                )
        default:
            return (
                functions
                    .config()
                    .tier.url.gbfs.replace(
                        '%LOCATION%',
                        provider.replace('tier', '').toUpperCase(),
                    ) +
                '/' +
                feed.replace(/_/g, '-')
            )
    }
}

async function getBearerToken<T extends keyof typeof Provider>(
    provider: T,
): Promise<string> {
    switch (provider) {
        case Provider.voioslo:
        case Provider.voitrondheim:
            return await getVoiBearerToken()
        case Provider.limeoslo:
            return await getLimeOsloToken()
        case Provider.boltoslo:
            return await getBoltOsloToken()
        case Provider.boltfredrikstad:
            return await getBoltFredrikstadToken()
        case Provider.boltlillestrom:
            return await getBoltLillestromToken()
        case Provider.boltbergen:
            return await getBoltBergenToken()
        default:
            return ''
    }
}

async function getFeed<T extends keyof typeof Provider>(
    provider: T,
    feedUrl: string,
    bearerToken: string,
): Promise<string> {
    if (isTier(provider)) {
        return await getTierFeed(provider, feedUrl)
    }
    switch (provider) {
        case Provider.voioslo:
        case Provider.voitrondheim:
            return await getVoiFeed(feedUrl, bearerToken)
        case Provider.limeoslo:
            return await getLimeFeed(feedUrl, bearerToken)
        case Provider.boltoslo:
        case Provider.boltfredrikstad:
        case Provider.boltlillestrom:
        case Provider.boltbergen:
            return await getBoltFeed(feedUrl, bearerToken)
        case Provider.moveabout:
            return await getMoveaboutFeed(feedUrl)
        default:
            throw new Error('Unknown provider')
    }
}

async function getVoiFeed(
    feedUrl: string,
    bearerToken: string,
): Promise<string> {
    const response: request.Response = await request
        .get(feedUrl)
        .set('Authorization', `Bearer ${bearerToken}`)
        .set('Accept', 'application/vnd.mds.provider+json;version=0.3')
    return response.text
}

async function getLimeFeed(
    feedUrl: string,
    bearerToken: string,
): Promise<string> {
    const response: request.Response = await request
        .get(feedUrl)
        .set('Authorization', `Bearer ${bearerToken}`)
    return response.text
}

async function getBoltFeed(
    feedUrl: string,
    bearerToken: string,
): Promise<string> {
    const response: request.Response = await request
        .get(feedUrl)
        .set('Authorization', `Bearer ${bearerToken}`)
        .set('Accept', 'application/json')
    return response.text
}

async function getVoiBearerToken(): Promise<string> {
    try {
        const res: request.Response = await request
            .post(`${functions.config().voi.url.sessionkey}`)
            .auth(
                functions.config().voi.api.user,
                functions.config().voi.api.pass,
            )
            .set('Accept', 'application/vnd.mds.provider+json;version=0.3')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send('grant_type=client_credentials')
        return JSON.parse(res.text).access_token
    } catch (err) {
        logError(Operator.VOI, err, 'Failed to refresh session key')
        return Promise.reject()
    }
}

async function getLimeOsloToken(): Promise<string> {
    return functions.config().lime.api.token
}

async function getBoltOsloToken(): Promise<string> {
    return await getBoltToken(
        functions.config().bolt.api.oslo.user,
        functions.config().bolt.api.oslo.pass,
    )
}

async function getBoltFredrikstadToken(): Promise<string> {
    return await getBoltToken(
        functions.config().bolt.api.fredrikstad.user,
        functions.config().bolt.api.fredrikstad.pass,
    )
}

async function getBoltLillestromToken(): Promise<string> {
    return await getBoltToken(
        functions.config().bolt.api.lillestrom.user,
        functions.config().bolt.api.lillestrom.pass,
    )
}

async function getBoltBergenToken(): Promise<string> {
    return await getBoltToken(
        functions.config().bolt.api.bergen.user,
        functions.config().bolt.api.bergen.pass,
    )
}

async function getBoltToken(user: string, pass: string): Promise<string> {
    console.log(
        `Refreshing ${Operator.BOLT.toLowerCase()} token with user ${user}`,
    )
    try {
        const res: request.Response = await request
            .post(`${functions.config().bolt.url.auth}`)
            .set('Content-Type', 'application/json')
            .send({
                user_name: user,
                user_pass: pass,
            })
        return JSON.parse(res.text).access_token
    } catch (err) {
        logError(Operator.BOLT, err, 'Failed to refresh session key')
        return Promise.reject()
    }
}

async function getMoveaboutFeed(feedUrl: string): Promise<string> {
    const response: request.Response = await request
        .get(feedUrl)
        .auth(
            functions.config().moveabout.api.user,
            functions.config().moveabout.api.pass,
        )
        .set('Accept', 'application/json')
    return response.text
}

async function getTierFeed<T extends keyof typeof Provider>(
    provider: T,
    feedUrl: string,
) {
    console.log(feedUrl)
    const response: request.Response = await request
        .get(feedUrl)
        .set('Accept', 'application/json')
        .set('x-api-key', functions.config().tier.api.gbfs)

    return response.text
}

export const v2_1 = functions.region('europe-west1').https.onRequest(app)
export const v2_2 = functions.region('europe-west1').https.onRequest(app)
