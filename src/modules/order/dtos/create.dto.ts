import { CreateDto as OrderDetail } from "@modules/orderDetail";
import { IsNotEmpty, Matches } from "class-validator";
import errorMessages from "@core/config/constants";

export class CreateDto {
    id?: number;
    code?: string;
    @IsNotEmpty({ message: errorMessages.ORDER_CUSTOMER_ID })
    customer_id?: number;
    publish?: number;
    created_id?: number;

    order_details?: OrderDetail[]
    pay_method?: number
    ship_method?: number

    customer_address?: string
    @IsNotEmpty({ message: errorMessages.CITY_NOT_EXISTED })
    city_id?: number
    city_name?: string
    @IsNotEmpty({ message: errorMessages.DISTRICT_NOT_EXISTED })
    district_id?: number
    district_name?: string
    @IsNotEmpty({ message: errorMessages.WARD_NOT_EXISTED })
    ward_id?: number
    ward_name?: string

    created_at?: Date
    processing_at?: Date
    delivering_at?: Date
    completed_at?: Date
    canceled_at?: Date
    updated_at?: Date


    customer_name?: string
    customer_phone?: string

    @IsNotEmpty({ message: errorMessages.NAME_NOT_EXISTED })
    name?: string
    @IsNotEmpty({ message: errorMessages.PHONE_NOT_EXISTED })
    @Matches(/^(0|\+84)([0-9]{9})$/, { message: 'Số điện thoại không đúng định dạng' })
    phone?: string
    @IsNotEmpty({ message: errorMessages.ADDRESS_NOT_EXISTED })
    address?: string
    status?: boolean | number
    des?: string
    status_payment?: number
    email?: string
    discount_value?: number
    discount_type?: number
    price_type?: number
    seller_id?: number
    branch_id?: number

    delivery_method?: string
    shipper_id?: number
    ship_key?: string
    ship_fee?: number
    ship_fee_payer?: string


    constructor(id: number, code?: string, customer_id?: number, branch_id?: number, publish?: number, created_id?: number, order_details?: OrderDetail[], pay_method?: number, ship_method?: number, customer_address?: string, city_id?: number, city_name?: string, district_id?: number, district_name?: string, ward_id?: number, ward_name?: string, created_at?: Date, processing_at?: Date, delivering_at?: Date, completed_at?: Date, canceled_at?: Date, updated_at?: Date, customer_name?: string, customer_phone?: string, name?: string, phone?: string, address?: string, status?: boolean, des?: string, status_payment?: number, email?: string, discount_value?: number, discount_type?: number, price_type?: number, delivery_method?: string, shipper_id?: number, ship_key?: string, ship_fee?: number, ship_fee_payer?: string) {
        this.id = id;
        this.publish = publish;
        this.created_id = created_id
        this.code = code
        this.customer_id = customer_id
        this.order_details = order_details
        this.pay_method = pay_method
        this.ship_method = ship_method;
        this.customer_address = customer_address
        this.city_id = city_id
        this.city_name = city_name
        this.district_id = district_id
        this.district_name = district_name
        this.ward_id = ward_id
        this.ward_name = ward_name
        this.created_at = created_at
        this.processing_at = processing_at
        this.delivering_at = delivering_at
        this.completed_at = completed_at
        this.canceled_at = canceled_at
        this.updated_at = updated_at;
        this.customer_name = customer_name;
        this.customer_phone = customer_phone;
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.status = status;
        this.des = des;
        this.status_payment = status_payment;
        this.email = email;
        this.discount_value = discount_value;
        this.discount_type = discount_type;
        this.price_type = price_type;
        this.branch_id = branch_id
        this.delivery_method = delivery_method
        this.shipper_id = shipper_id
        this.ship_key = ship_key
        this.ship_fee = ship_fee
        this.ship_fee_payer = ship_fee_payer
    }
}
