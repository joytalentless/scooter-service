import {Operator} from "./operators";

export const capitalizeFirstLetter = (str: string) => `${str[0].toUpperCase()}${str.slice(1).toLocaleLowerCase()}`

export const logError = (operator: Operator, err: any, details?: string) => {
    console.error(`Operator: ${capitalizeFirstLetter(operator)} - Status: ${err.status}${details ? "Details: " + details : ""} \n${err.stack}`);
}