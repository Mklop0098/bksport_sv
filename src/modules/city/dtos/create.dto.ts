import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number;
    @IsNotEmpty()
    @IsString()
    name: string;

    publish: boolean;

    constructor(id: number, name: string, publish: boolean) {
        this.id = id;
        this.name = name;
        this.publish = publish;
    }
}