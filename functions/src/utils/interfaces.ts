export interface Vehicle {
    id: string
    operator: string
    lat: number
    lon: number
    code?: string
    battery?: number
    batteryLevel?: string
}

export interface Voi {
    bike_id: string
    lat: number
    lon: number
    is_reserved: boolean
    is_disabled: boolean
    battery: number
}

export interface Tier {
    id: string
    attributes: {
        lat: number
        lng: number
        code: number
        batteryLevel: number
    }
}

export interface Zvipp {
    bike_id: number
    operator: string
    lat: string
    lon: string
    is_reserved: boolean
    is_disabled: boolean
    'qr-code': string
    battery: number
}

export interface Lime {
    bike_id: string
    operator: string
    lat: string
    lon: string
    is_reserved: boolean
    is_disabled: boolean
    battery_level: string
}

export interface ScooterQuery {
    lat?: string
    lon?: string
    range?: string
    max?: string
}

export interface priceText {
    nob: string
    nno: string
    eng: string
}

export interface priceTexts {
    [key: string]: priceText
}

export interface ScooterPrice {
    startPrice: number
    pricePerMinute: number
}
