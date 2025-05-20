import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";

export interface ICustomerGroup {
    id?: number;
    name: string;
    public: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export class Customer {
    @IsNotEmpty()
    @IsNumber()
    id?: number;

    @IsNotEmpty()
    @IsString()
    name?: string;

    @IsNotEmpty()
    @IsBoolean()
    publish?: boolean;

    @IsDate()
    created_at?: Date;

    @IsDate()
    updated_at?: Date;

    constructor(id: number, name: string, publish: boolean, created_at: Date, updated_at: Date) {
        this.id = id;
        this.name = name;
        this.publish = publish;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}