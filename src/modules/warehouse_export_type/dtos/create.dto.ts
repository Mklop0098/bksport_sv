import { IsNotEmpty, IsString, Matches } from "class-validator";
import { CreateDto as DeliveryNoteDetail } from "@modules/deliveryNoteDetail/index"
import errorMessages from "@core/config/constants";
export class CreateDto {
    id?: number;
    // @Matches(/^.{8}$|^$/, { message: errorMessages.CODE_LENGTH_INPUT })
    code?: string;
    created_id?: number;
    @IsNotEmpty({ message: errorMessages.DELIVERY_NOTE_NOT_REQUIRED })
    delivery_note_detail?: DeliveryNoteDetail[];
    seller_id?: number;
    branch_id?: number;

    constructor(id: number, code: string, created_id: number, delivery_note_detail: DeliveryNoteDetail[], seller_id: number, branch_id?: number) {
        this.id = id;
        this.code = code;
        this.created_id = created_id;
        this.delivery_note_detail = delivery_note_detail;
        this.seller_id = seller_id;
        this.branch_id = branch_id
    }
}