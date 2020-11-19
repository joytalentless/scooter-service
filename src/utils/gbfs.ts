interface GBFSBase {
    data: any
    last_updated: number
    ttl: number
    version: string
}

type GBFSFeedName =
    | 'gbfs'
    | 'gbfs_versions'
    | 'system_information'
    | 'vehicle_types'
    | 'station_information'
    | 'station_status'
    | 'free_bike_status'
    | 'system_hours'
    | 'system_calendar'
    | 'system_regions'
    | 'system_pricing_plans'
    | 'system_alerts'
    | 'geofencing_zones'

interface Feed {
    name: GBFSFeedName
    url: string
}

interface GBFSData {
    feeds: Feed[]
}

interface GBFS extends GBFSBase {
    data: { [key: string]: GBFSData }
    last_updated: number
    ttl: number
    version: string
}

interface Version {
    url: string
    version: string
}

interface GBFSVersionsData {
    versions: Version[]
}

interface GBFSVersions extends GBFSBase {
    data: GBFSVersionsData
    last_updated: number
    ttl: number
    version: string
}

interface RentalApp {
    discovery_uri: string
    store_uri: string
}

interface RentalApps {
    android: RentalApp | null
    ios: RentalApp | null
}

interface SystemInformationData {
    email?: string | null
    feed_contact_email?: string | null
    language: string
    license_url?: string | null
    name: string
    operator?: string | null
    phone_number?: string | null
    purchase_url?: string | null
    rental_apps?: RentalApps | null
    short_name?: string | null
    start_date?: string | null
    system_id: string
    timezone: string
    url?: string | null
}

interface SystemInformation extends GBFSBase {
    data: SystemInformationData
    last_updated: number
    ttl: number
    version: string
}

type FormFactor = 'bicycle' | 'car' | 'moped' | 'scooter' | 'other'

type PropulsionType = 'human' | 'electric_assist' | 'electric' | 'combustion'

interface VehicleType {
    form_factor: FormFactor
    max_range_meters: number | null
    name?: string | null
    propulsion_type: PropulsionType
    vehicle_type_id: string
}

interface VehicleTypesData {
    vehicle_types: VehicleType[]
}

interface VehicleTypes extends GBFSBase {
    data: VehicleTypesData
    last_updated: number
    ttl: number
    version: string
}

type RentalMethod =
    | 'KEY'
    | 'CREDITCARD'
    | 'PAYPASS'
    | 'APPLEPAY'
    | 'ANDROIDPAY'
    | 'TRANSITCARD'
    | 'ACCOUNTNUMBER'
    | 'PHONE'

interface RentalUris {
    android: string | null
    ios: string | null
    web: string | null
}

interface MultiPolygon {
    coordinates: number[][][][]
}

interface Station {
    address: string | null
    capacity: number | null
    cross_street: string | null
    is_valet_station: boolean | null
    is_virtual_station: boolean | null
    lat: number
    lon: number
    name: string
    post_code: string | null
    region_id: string | null
    rental_methods: RentalMethod[] | null
    rental_uris: RentalUris | null
    short_name: string | null
    station_area: MultiPolygon | null
    station_id: string
    vehicle_capacity: { [key: string]: number } | null
    vehicle_type_capacity: { [key: string]: number } | null
}

interface StationInformationData {
    stations: Station[]
}

interface StationInformation extends GBFSBase {
    data: StationInformationData
    last_updated: number
    ttl: number
    version: string
}

interface VehicleDockAvailability {
    count: number
    vehicle_type_ids: string[]
}

interface VehicleTypeAvailability {
    count: number
    vehicle_type_id: string
}

interface StationStatusEntity {
    is_installed: boolean
    is_renting: boolean
    is_returning: boolean
    last_reported: number
    num_bikes_available: number
    num_bikes_disabled: number | null
    num_docks_available: number | null
    num_docks_disabled: number | null
    station_id: string
    vehicle_docks_available: VehicleDockAvailability[] | null
    vehicle_types_available: VehicleTypeAvailability[] | null
}

interface StationStatusData {
    stations: StationStatusEntity[]
}

interface StationStatus extends GBFSBase {
    data: StationStatusData
    last_updated: number
    ttl: number
    version: string
}

interface Bike {
    bike_id: string
    current_range_meters: number | null
    is_disabled: boolean
    is_reserved: boolean
    last_reported: number | null
    lat: number | null
    lon: number | null
    pricing_plan_id: string | null
    rental_uris: RentalUris | null
    station_id: string | null
    vehicle_type_id: string | null
}

interface FreeBikeStatusData {
    bikes: Bike[]
}

interface FreeBikeStatus extends GBFSBase {
    data: FreeBikeStatusData
    last_updated: number
    ttl: number
    version: string
}

type WeekDay =
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY'
    | 'SATURDAY'
    | 'SUNDAY'

type UserType = 'MEMBER' | 'NONMEMBER'

interface RentalHour {
    days: WeekDay[]
    end_time: string
    start_time: string
    user_types: UserType[]
}

interface SystemHoursData {
    rental_hours: RentalHour[]
}

interface SystemHours extends GBFSBase {
    data: SystemHoursData
    last_updated: number
    ttl: number
    version: string
}

interface Calendar {
    end_day: number
    end_month: number
    end_year: number | null
    start_day: number
    start_month: number
    start_year: number | null
}

interface SystemCalendarData {
    calendars: Calendar[]
}

interface SystemCalendar extends GBFSBase {
    data: SystemCalendarData
    last_updated: number
    ttl: number
    version: string
}

interface Region {
    name: string
    region_id: string
}

interface SystemRegionsData {
    regions: Region[]
}

interface SystemRegions extends GBFSBase {
    data: SystemRegionsData
    last_updated: number
    ttl: number
    version: string
}

interface PricingSegment {
    end?: number | null
    interval: number
    rate: number
    start: number
}

interface Plan {
    currency: string
    description: string
    is_taxable: boolean
    name: string
    per_km_pricing?: PricingSegment[] | null
    per_min_pricing?: PricingSegment[] | null
    plan_id: string
    price: number
    surge_pricing?: boolean | null
    url?: string | null
}

interface SystemPricingPlansData {
    plans: Plan[]
}

interface SystemPricingPlans extends GBFSBase {
    data: SystemPricingPlansData
    last_updated: number
    ttl: number
    version: string
}

interface AlertTime {
    end: number | null
    start: number
}

type AlertType = 'SYSTEM_CLOSURE' | 'STATION_CLOSURE' | 'STATION_MOVE' | 'OTHER'

interface Alert {
    alertId: string
    description: string | null
    last_updated: number | null
    region_ids: string[] | null
    station_ids: string[] | null
    summary: string
    times: AlertTime[] | null
    type: AlertType
    url: string | null
}

interface SystemAlertsData {
    alerts: Alert[]
}

interface SystemAlerts extends GBFSBase {
    data: SystemAlertsData
    last_updated: number
    ttl: number
    version: string
}

interface Rule {
    maximum_speed_kph: number | null
    ride_allowed: boolean
    ride_through_allowed: boolean
    vehicle_type_ids: string[] | null
}

interface Properties {
    end: number | null
    name: string | null
    rules: Rule[] | null
    start: number | null
}

interface Feature {
    geometry: MultiPolygon
    properties: Properties
}

interface FeatureCollection {
    features: Feature[]
    type: string
}

interface GeofencingZonesData {
    geofencing_zones: FeatureCollection
}

interface GeofencingZones extends GBFSBase {
    data: GeofencingZonesData
    last_updated: number
    ttl: number
    version: string
}
