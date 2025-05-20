import errorMessages from '@core/config/constants';
import orderStatus from '@core/config/constants';
import database from '@core/config/database';
import { HttpException } from '@core/exceptions';
import axios from 'axios';
import { RowDataPacket } from 'mysql2';
export const convertPushlishNumberToOrderStatus = (publishNumber: number) => {
    if (publishNumber === 1) {
        return orderStatus.ORDER_STATUS_NEW;
    }
    if (publishNumber === 2) {
        return orderStatus.ORDER_STATUS_PROCESSING;
    }
    if (publishNumber === 3) {
        return orderStatus.ORDER_STATUS_PACKING;
    }
    if (publishNumber === 7) {
        return orderStatus.ORDER_STATUS_WAITING
    }
    if (publishNumber === 4) {
        return orderStatus.ORDER_STATUS_DELIVERING
    }
    if (publishNumber === 5) {
        return orderStatus.ORDER_STATUS_DELIVERED
    }
    if (publishNumber === 6) {
        return orderStatus.ORDER_STATUS_CANCEL
    }
}

export const convertOrderStatusPayment = (statusPayment : number) => {
    if(statusPayment === 0){
        return orderStatus.STATUS_PAYMENT_0;
    }
    if(statusPayment === 1){
        return orderStatus.STATUS_PAYMENT_1;
    }
    if(statusPayment === 2){
        return orderStatus.STATUS_PAYMENT_2;
    }
}

export type CheckInventory = {
    product_id: number
    quantity: number
    available: number
}

export type CheckOrderQuantity = {
    product_id: number
    quantity: number
    price: number
    combo_id: number
    discount_type: number
    discount_value: number  
    price_combo: number
}

export const checkInventory = async (product_id: number, quantity: number, branch_id: number) => {
    const query = `SELECT quantity FROM warehouse WHERE product_id = ? AND branch_id = ?`
    const result = await database.executeQuery(query, [product_id, branch_id]) as RowDataPacket
    if (result.length > 0) {
        return result[0].quantity >= quantity
    }
    return false
}

export const getDeliveryDetail = async (order_id: number) => {
    try {
        const data = await axios.get(`${process.env.DELIVERY_URL}/shipments/findByOrderId/${order_id}`)
        return data.data
    } catch (error) {
        return new HttpException(404, 'Không tìm thấy đơn hàng')
    }
}

export const updateStatusOrderDelivery = async (id: number, status: string) => {
    try {
        const result = await axios.put(`${process.env.DELIVERY_URL}/shipments/updateStatusByOrderId`, {
            listId: [id],
            status: status
        })
        return result.data
    } catch (error) {
        return new HttpException(404, errorMessages.UPDATE_FAILED)
    }
}
