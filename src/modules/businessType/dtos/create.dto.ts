import { IsNotEmpty, IsString } from "class-validator";

export class Create {
    @IsString()
    @IsNotEmpty({ message: 'Tên không được để trống' })
    name: string;
    publish: number


    constructor(name: string, publish: number) {
        this.name = name;
        this.publish = publish;
    }
}