import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar, generateCodeWithSeller } from "@core/utils/gennerate.code";
import OrdersBookingDetailService from "@modules/ordersBookingDetail/service";
import { IReportStatus } from "@modules/order/interface";

class OrdersBookingService {

    private tableName = 'orders_booking';
    private ordersBookingDetailService = new OrdersBookingDetailService();

    public getAllOrdersBooking = async (id: number) => {
        try {
            const unFollowQuery = `
                SELECT f.user_id, u.name FROM ${this.tableName} f
                LEFT JOIN users u ON f.user_id = u.id
                WHERE f.seller_id = ?
            `
            const result = await database.executeQuery(unFollowQuery, [id]) as RowDataPacket
            return {
                data: result
            }

        } catch (error) {
            return new HttpException(400, errorMessages.FOLLOW_ERROR)
        }
    }

    public create = async (model: CreateDto) => {
        console.log(model)
        try {
            let code = ""
            if (model.seller_id == 1) {
                code = await generateCodePrefixChar(this.tableName, 'Y', 7) as string
            } else {
                code = await generateCodeWithSeller(this.tableName, 'Y', 8, model.seller_id as number) as string
            }
            const query = `
                INSERT INTO ${this.tableName} 
                (code, name, phone, customer_id, city_id, district_id, ward_id, address, pay_method, status, des, price, voucher, drink_ready, created_id, seller_id, field_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
            const result = await database.executeQuery(query, [
                code,
                model.name || null,
                model.phone || null,
                model.customer_id || null,
                model.city_id || null,
                model.district_id || null,
                model.ward_id || null,
                model.address || null,
                model.pay_method || null,
                model.status || 1,
                model.des || null,
                model.price || null,
                model.voucher || null,
                model.drink_ready || null,
                model.created_id || null,
                model.seller_id || null,
                model.field_id || null
            ]) as RowDataPacket
            if (result.insertId === 0) {
                return new HttpException(200, errorMessages.CREATE_FAILED)
            }
            if (model.order_booking_detail && model.order_booking_detail.length > 0) {
                for (const item of model.order_booking_detail) {
                    await this.ordersBookingDetailService.create({ ...item, order_booking_id: result.insertId })
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.FOLLOW_ERROR)
        }
    }

    public search = async (seller_id: number, page: number, limit: number) => {
        try {
            let query = ` 
                SELECT ob.*,
                CASE
                    WHEN ob.status = 1 THEN 'Chờ xác nhận'
                    WHEN ob.status = 2 THEN 'Đã xác nhận'
                    WHEN ob.status = 3 THEN 'Đã hủy'
                    WHEN ob.status = 4 THEN 'Đã hủy'
                END as status_name,
                f.name as field_name,
                c.name as city_name,
                d.name as district_name,
                w.name as ward_name,
                ob.status_payment as pay_method
                FROM ${this.tableName} ob
                left join fields f on ob.field_id = f.id
                left join city c on ob.city_id = c.id
                left join district d on ob.district_id = d.id
                left join ward w on ob.ward_id = w.id
                WHERE ob.seller_id = ?
                ORDER BY ob.created_at DESC
            `
            const resultNotPagination = await database.executeQuery(query, [seller_id]) as RowDataPacket
            if (page && limit) {
                query = query + ` LIMIT ` + limit + ` OFFSET ` + (page - 1) * limit;
            }
            const result = await database.executeQuery(query, [seller_id]) as RowDataPacket
            const listStatus: IReportStatus[] = [
                { status: 1, total_orders: 0 },
                { status: 2, total_orders: 0 },
                { status: 3, total_orders: 0 }
            ]
            const resultMap = new Map();
            for (const item of resultNotPagination as any) {
                const status = item.status
                if (resultMap.has(status)) {
                    resultMap.get(status).push(item);
                } else {
                    resultMap.set(status, [item]);
                }
            }
            const statusMap = new Map()
            for (const item of listStatus) {
                statusMap.set(item.status, item);
            }
            for (const [status, items] of resultMap) {
                const statusItem = statusMap.get(status);
                if (statusItem) {
                    statusItem.total_orders += items.length
                }
            }
            const pagination: IPagiantion = {
                page: page,
                limit: limit,
                totalPage: Math.ceil((resultNotPagination as any).length / limit!)
            }
            return {
                data: result.length > 0 ? result : [],
                pagination: pagination,
                listStatus: listStatus
            }
        } catch (error) {
            return new HttpException(400, errorMessages.FOLLOW_ERROR)
        }
    }

    public updateListStatus = async (listId: number[], status: number) => {
        try {
            for (const id of listId) {
                const exist = await checkExist(this.tableName, 'id', id)
                console.log(exist)

                if (exist != false && (exist[0].status + 1 == status || status == 3)) {
                    let query = `UPDATE ${this.tableName} SET status = ?`
                    if (status == 3) {
                        query += `, status_payment = 0`
                    }
                    query += ` WHERE id = ?`
                    await database.executeQuery(query, [status, id])
                }
                else {
                    return new HttpException(400, "Trạng thái không hợp lệ")
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.FOLLOW_ERROR)
        }
    }

    public updateStatusPayment = async (id: number) => {
        console.log(id)
        try {
            const result = await database.executeQuery(`UPDATE ${this.tableName} SET status_payment = 1 WHERE id = ?`, [id]) as RowDataPacket
            if (result.length === 0) {
                return new HttpException(400, "Cập nhật trạng thái thanh toán thất bại")
            }
        } catch (error) {
            return new HttpException(400, errorMessages.FOLLOW_ERROR)
        }
    }

    public findById = async (id: number) => {
        const result = await database.executeQuery(`
            SELECT ob.*, f.name as field_name, c.name as city_name, d.name as district_name, w.name as ward_name,
            GROUP_CONCAT(
                DISTINCT 
                    JSON_OBJECT(
                        'id', obd.id,   
                        'order_id', obd.order_id,
                        'date', obd.date,
                        'time', obd.time,
                        'meridiem', obd.meridiem
                    )
            ) as order_booking_detail
            FROM ${this.tableName} ob
            left join fields f on f.id = ob.field_id
            left join city c on c.id = ob.city_id
            left join district d on d.id = ob.district_id
            left join ward w on w.id = ob.ward_id
            left join order_booking_detail obd on obd.order_id = ob.id
            WHERE ob.id = ? 
        `, [id]) as RowDataPacket
        if (result.length === 0) {
            return new HttpException(400, "Không tìm thấy đơn hàng")
        }
        return {
            data: {...result[0], order_booking_detail: result[0].order_booking_detail ? JSON.parse('[' + result[0].order_booking_detail + ']') : []}
        }
    }


    public update = async (model: CreateDto, id: number) => {
        console.log([
            model.name || null,
            model.phone || null,
            model.customer_id || null,
            model.city_id || null,
            model.district_id || null,
            model.ward_id || null,
            model.address || null,
            model.pay_method || null,
            model.status || 1,
            model.des || null,
            model.price || null,
            model.voucher || null,
            model.drink_ready || null,
            model.created_id || null,
            model.seller_id || null,    
            model.field_id || null,
            id
        ])
        try {
            let query = `
                UPDATE ${this.tableName} 
                SET 
                    name = ?, 
                    phone = ?, 
                    customer_id = ?, 
                    city_id = ?, 
                    district_id = ?, 
                    ward_id = ?, 
                    address = ?, 
                    pay_method = ?, 
                    status = ?, 
                    des = ?, 
                    price = ?, 
                    voucher = ?, 
                    drink_ready = ?, 
                    created_id = ?, 
                    seller_id = ?, 
                    field_id = ?
                WHERE id = ?
            `
            const result = await database.executeQuery(query, [
                model.name || null,
                model.phone || null,
                model.customer_id || null,
                model.city_id || null,
                model.district_id || null,
                model.ward_id || null,
                model.address || null,
                model.pay_method || null,
                model.status || 1,
                model.des || null,
                model.price || null,
                model.voucher || null,
                model.drink_ready || null,
                model.created_id || null,
                model.seller_id || null,    
                model.field_id || null,
                id
            ]) as RowDataPacket
            console.log(result)
            if (result.affectedRows === 0) {
                return new HttpException(200, errorMessages.UPDATE_FAILED)
            }
            if (model.order_booking_detail && model.order_booking_detail.length > 0) {
                console.log(model.order_booking_detail)
                await database.executeQuery(`DELETE FROM order_booking_detail WHERE order_id = ?`, [id])
                for (const item of model.order_booking_detail) {
                    const data = {
                        order_booking_id: id,
                        date: item.date,
                        time: item.time,
                        meridiem: item.meridiem
                    }
                    await this.ordersBookingDetailService.create(data)
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }
}

export default OrdersBookingService