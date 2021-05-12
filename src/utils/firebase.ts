import * as functions from 'firebase-functions'

interface Toggles {
    lime?: 'off'
    tier?: 'off'
    voi?: 'off'
    zvipp?: 'off'
    bolt?: 'off'
}

export const toggles = (): Toggles =>
    (functions.config().toggles as Toggles) || {}
