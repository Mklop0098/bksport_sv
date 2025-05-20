import { IMessage } from "../interface";

export class CreateDto {
    id?: number;
    receiver_id?: number;
    message?: string | IMessage;
    notification_type_id?: number;
    status?: number;
    user_id?: number;
    created_at?: Date;
    updated_at?: Date;

    constructor(id: number, receiver_id: number, order_id: number, message: string | IMessage, status: number, created_at: Date, updated_at: Date, notification_type_id: number, user_id: number) {
        this.id = id;
        this.receiver_id = receiver_id;
        this.message = message;
        this.status = status;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.notification_type_id = notification_type_id;
        this.user_id = user_id;
    }
}