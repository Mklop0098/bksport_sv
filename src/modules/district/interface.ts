export interface Iward {
    name: string,
    pre: string
}

export interface IDistrict {
    name: string,
    pre: string,
    ward: Iward[]
}


export interface ICity {
    code: string,
    name: string,
    district: IDistrict[]
}
