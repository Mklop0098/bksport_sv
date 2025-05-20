import errorMessages from "@core/config/constants";
import { HttpException } from "@core/exceptions";
import OrderService from "@modules/order/service";
import ProductService from "@modules/product/product.service";
import axios from "axios";

export const StatusDeliveryOrder = {
    NEW: 'cho_xuat',
    CONFIRM: 'da_xuat_kho',
    COMPLETED: 'hoan_thanh',
    CANCEL: 'huy',
}

export const TypeDeliveryOrder = {
    BUY: 'xuat_kho_ban_le',
    BEGINNING: 'xuat_kho_trong_ky',
    TRANSFER: 'xuat_kho_chuyen',
}

export const convertStatusKeyToStatusName = (status: string) => {
    if (status == StatusDeliveryOrder.NEW) {
        return "Chờ xuất kho";
    }
    if (status == StatusDeliveryOrder.COMPLETED) {
        return "Hoàn thành"
    }
    if(status == StatusDeliveryOrder.CONFIRM){
        return "Đã xuất kho"
    }
}

export const convertTypeKeyToTypeName = (type: string) => {
    if (type == TypeDeliveryOrder.BUY) {
        return "Xuất kho bán lẻ";
    }
    if (type == TypeDeliveryOrder.BEGINNING) {
        return "Xuất kho trong kỳ"
    }
    if(type == TypeDeliveryOrder.TRANSFER){
        return "Xuất kho chuyển"
    }
}

export const findProductById = async (id: number) => {
    const productService = new ProductService()
    const product = await productService.findByIdUpdate(id)
    if (product instanceof Error) {
        return new HttpException(404, errorMessages.NOT_FOUND)
    }
    return product
}

export const updateStatusOrder = async (id: number, status: number, created_id: number, seller_id: number) => {
    console.log('updateStatusOrder', id, status, created_id, seller_id)
    const orderService = new OrderService()
    if (status === 5) {
        const payment = await orderService.updateListStatusPayment([id], 1)
        if (payment instanceof Error) {   
            return new HttpException(404, errorMessages.UPDATE_FAILED)
        }
    }
    const order = await orderService.updateListStatus([id], status, created_id, seller_id)
    console.log(order)
    if (order instanceof Error) {   
        return new HttpException(404, errorMessages.UPDATE_FAILED)
    }
    return order
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


