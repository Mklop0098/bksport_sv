import errorMessages from "@core/config/constants";
import { CreateDto as OrderDetail } from "@modules/orderDetail";
import { IsNotEmpty, Matches } from "class-validator";

export class CommissionDto {
    @IsNotEmpty({ message: errorMessages.EMPLOYEE_ID_REQUIRED })
    id?: number;
    @IsNotEmpty({ message: errorMessages.FROM_DATE_REQUIRED })
    fromDate?: string;
    @IsNotEmpty({ message: errorMessages.TO_DATE_REQUIRED })
    toDate?: string;

    constructor(id: number, fromDate?: string, toDate?: string) {
        this.id = id;
        this.fromDate = fromDate;
        this.toDate = toDate;
    }
}