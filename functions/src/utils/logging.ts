export const logError = (operator: string, err: any, details?: string) => {
    console.error(`Operator: ${operator} - Status: ${err.status}${details ? "Details: " + details : ""} \n${err.stack}`);
}