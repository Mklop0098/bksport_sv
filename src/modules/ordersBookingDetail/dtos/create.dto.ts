import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number
    order_booking_id?: number
    date?: string
    time?: string
    meridiem?: string

    constructor(id: number, order_booking_id: number, date: string, time: string, meridiem: string) {
        this.id = id,
        this.order_booking_id = order_booking_id,
        this.date = date,
        this.time = time,
        this.meridiem = meridiem
    }
}