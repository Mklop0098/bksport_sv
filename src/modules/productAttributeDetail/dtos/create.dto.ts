import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number
    @IsNotEmpty()
    values?: string[]
    @IsNotEmpty()
    attribute_id?: number
    parent_id?: number

    constructor(id: number, values: string[], attribute_id: number, parent_id: number) {
        this.id = id,
        this.values = values
        this.attribute_id = attribute_id
        this.parent_id = parent_id
    }
}