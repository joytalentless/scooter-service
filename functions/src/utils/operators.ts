export enum Operator {
    VOI = "VOI",
    TIER = "TIER",
    ZVIPP = "ZVIPP",
    LIME = "LIME"
}

const getCodespace = (operator: Operator): string => {
    switch (operator) {
        case Operator.VOI:
            return "YVO";
        case Operator.TIER:
            return "YTI";
        case Operator.ZVIPP:
            return "YZV";
        case Operator.LIME:
            return "LIM";
    }
}
export const getNeTExId = (id: string, operator: Operator) => `${getCodespace(operator)}:Scooter:${id}`