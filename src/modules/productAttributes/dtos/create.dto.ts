import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number
    @IsNotEmpty()
    name?: string
    @IsNotEmpty()
    product_parent_id?: number
    values?: string[]

    constructor(id: number, name: string, product_parent_id: number, values: string[]) {
        this.id = id,
        this.name = name
        this.product_parent_id = product_parent_id
        this.values = values
    }
}