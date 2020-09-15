import { Operator } from './operators'

export const capitalizeFirstLetter = (str: string): string =>
    `${str[0].toUpperCase()}${str.slice(1).toLocaleLowerCase()}`

export const logError = (
    operator: Operator,
    err: Error & { status?: number },
    details?: string,
): void => {
    console.error(
        `Operator: ${capitalizeFirstLetter(operator)} - Status: ${err.status}${
            details ? 'Details: ' + details : ''
        } \n${err.stack}`,
    )
}
