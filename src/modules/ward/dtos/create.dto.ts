import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number;
    @IsNotEmpty()
    @IsString()
    name: string;

    publish: boolean;

    district_id: number;

    constructor(id: number, name: string, publish: boolean, district_id: number) {
        this.id = id;
        this.name = name;
        this.publish = publish;
        this.district_id = district_id;
    }
}