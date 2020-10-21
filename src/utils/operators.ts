export enum Operator {
    VOI = 'VOI',
    TIER = 'TIER',
    ZVIPP = 'ZVIPP',
    LIME = 'LIME',
}

export const ALL_OPERATORS = Object.values(Operator)

const getCodespace = (operator: Operator): string => {
    switch (operator) {
        case Operator.VOI:
            return 'YVO'
        case Operator.TIER:
            return 'YTI'
        case Operator.ZVIPP:
            return 'YZV'
        case Operator.LIME:
            return 'YLI'
    }
}

export function getNeTExId(id: string, operator: Operator): string {
    return `${getCodespace(operator)}:Scooter:${id}`
}

export function isOperatorName(name: string): name is Operator {
    return name in Operator
}
