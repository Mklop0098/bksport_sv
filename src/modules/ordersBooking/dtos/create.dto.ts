import { IsNotEmpty, IsString } from "class-validator";
import { CreateDto as OrderBookingDetailDto } from "@modules/ordersBookingDetail/dtos/create.dto";

export class CreateDto {
    id?: number
    code?: string
    name?: string
    phone?: string
    customer_id?: number
    city_id?: number
    district_id?: number
    ward_id?: number
    address?: string
    pay_method?: string
    status?: string
    des?: string
    price?: number
    voucher?: number
    drink_ready?: number
    created_id?: number
    seller_id?: number
    field_id?: number
    order_booking_detail?: OrderBookingDetailDto[]

    constructor(id: number, code: string, name: string, phone: string, customer_id: number, city_id: number, district_id: number, ward_id: number, address: string, pay_method: string, status: string, des: string, price: number, voucher: number, drink_ready: number, created_id: number, seller_id: number, field_id: number) {
        this.id = id,
        this.code = code,
        this.name = name,
        this.phone = phone,
        this.customer_id = customer_id,
        this.city_id = city_id,
        this.district_id = district_id,
        this.ward_id = ward_id,
        this.address = address,
        this.pay_method = pay_method,
        this.status = status,
        this.des = des,
        this.price = price,
        this.voucher = voucher,
        this.drink_ready = drink_ready,
        this.created_id = created_id,
        this.seller_id = seller_id,
        this.field_id = field_id
    }
}