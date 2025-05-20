import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { StatusPaymentPurchase } from "@modules/purchaseOrder/interface";
import moment from "moment";

class PurchaseOrderStatusPaymentService {
    private tableName = 'purchase_status_payment_history';
    private fieldId = 'id'

    public create = async (model: CreateDto) => {
        //console.log("model", model);

        let query = `insert into ${this.tableName} (order_id, status, created_at, user_id, amount_paid, payment_method ,seller_id, payment_date,  updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        const created_at = new Date()
        const updated_at = new Date()
        // if (!moment(model.payment_date, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
        //     const correctedDate = moment(model.payment_date).format('YYYY-MM-DD HH:mm:ss');
        //     model.payment_date = correctedDate as any as Date
        // }
        const values = [
            model.order_id,
            model.status || StatusPaymentPurchase.PAID,
            created_at || null,
            model.user_id,
            model.amount_paid,
            model.payment_method,
            model.seller_id,
            model.payment_date || created_at,
            updated_at
        ]
       //console.log(query, values)
        const result = await database.executeQuery(query, values);
        //console.log("result1", result);

        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED)
        return {
            data: {
                id: (result as any).insertId,
                ...model,
                created_at: created_at
            }
        }
    }

    public update = async (model: CreateDto, id: number) => {
        if (!await checkExist(this.tableName, this.fieldId, id.toString()))
            return new HttpException(400, errorMessages.EXISTED, this.fieldId);
        let query = `update ${this.tableName} set `
        let values = []
        if (model.order_id != undefined) {
            query += `order_id = ?,`
            values.push(model.order_id)
        }
        if (model.status != undefined) {
            query += `status = ?,`
            values.push(model.status)
        }
        if (model.user_id) {
            query += `user_id = ?,`
            values.push(model.user_id)
        }
        if (model.payment_date !== undefined) {
            query += `payment_date = ?,`
            values.push(model.payment_date)
        }
        query += `where id = ?`
        values.push(id)
        const result = await database.executeQuery(query, values)
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        return {
            data: {
                id: id,
                ...model,
            }
        }
    }
    public delete = async (id: number) => {
        if (!await checkExist(this.tableName, this.fieldId, id.toString()))
            return new HttpException(400, errorMessages.EXISTED);
        const result = await database.executeQuery(`delete from ${this.tableName} where id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: id
        }
    }
    public findById = async (id: number) => {
        const result = await checkExist(this.tableName, this.fieldId, id.toString());
        if (result == false)
            return new HttpException(400, errorMessages.NOT_EXISTED);
        return {
            data: (result as any)[0]
        }
    }
    public searchs = async (key: string, name: string, status: boolean, page: number, limit: number) => {
        let query = `select * from ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;
        query += ` order by id desc`
        if (page && page < 1 || page && limit < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (page && limit)
            query = query + ` LIMIT ` + limit + ` OFFSET ` + (page - 1) * limit;
        let pagination: IPagiantion = {
            page: page,
            limit: limit,
            totalPage: 0
        }
        const count = await database.executeQuery(countQuery);
        const totalPages = Math.ceil((count as RowDataPacket[])[0].total / limit);
        if (Array.isArray(count) && count.length > 0)
            pagination.totalPage = totalPages
        const result = await database.executeQuery(query);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result,
            pagination: pagination
        }
    }
    public updateStatus = async (id: number) => {
        try {
            let result = null;
            let status = 0
            const update_at = new Date()
            const getStatus = await database.executeQuery(`select status from ${this.tableName} where id = ?`, [id]);
            if ((getStatus as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND);
            if ((getStatus as RowDataPacket[])[0].status == 0) {
                status = 1
                result = await database.executeQuery(`update ${this.tableName} set status = ?, updated_at = ? where id = ?`, [status, update_at, id]);
            }
            if ((getStatus as RowDataPacket[])[0].status == 1) {
                result = await database.executeQuery(`update ${this.tableName} set status = ?, updated_at = ? where id = ?`, [status, update_at, id]);
            }
            return {
                data: {
                    id: id,
                    status: status,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public deleteRows = async (data: number[]) => {
        let query = `delete from ${this.tableName} where id in (${data})`
        const result = await database.executeQuery(query);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS
        }
    }
    public updateListStatus = async (data: number[], status: number) => {
        try {
            let result = null;
            const update_at = new Date()
            let query = `update ${this.tableName} set status = ?, updated_at = ? where id in (${data})`
            result = await database.executeQuery(query, [status, update_at]);
            return {
                data: {
                    status: status,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public findAllOrderStatusByOrderId = async (order_id: number) => {
        let query = `select * from ${this.tableName} where order_id = ? order by id desc`
        const result = await database.executeQuery(query, [order_id]);
        if (Array.isArray(result) && result.length == 0)
            return new HttpException(404, errorMessages.NOT_FOUND + " order_id");
        return {
            data: result
        }
    }
    public findAllStatusByOrderId = async (order_id: number) => {
        let query = `select * from ${this.tableName} where order_id = ? order by id desc`
        let data = {
            not_payment_at: null,
            partually_paid_at: null,
            paid: null
        }
        const result = await database.executeQuery(query, [order_id]);
        for (let i = 0; i < (result as RowDataPacket[]).length && i < 3; i++) {
            if ((result as RowDataPacket[])[i].status == StatusPaymentPurchase.NOT_PAYMENT)
                data.not_payment_at = (result as RowDataPacket[])[i].created_at
            if ((result as RowDataPacket[])[i].status == StatusPaymentPurchase.PARTIALLY_PAID)
                data.partually_paid_at = (result as RowDataPacket[])[i].created_at
            if ((result as RowDataPacket[])[i].status == StatusPaymentPurchase.PAID)
                data.paid = (result as RowDataPacket[])[i].created_at
        }
        return {
            data: data
        }
    }
    public findOrderStatusByOrderId = async (order_id: number) => {
        let query = `select * from ${this.tableName} where order_id = ?`
        const result = await database.executeQuery(query, [order_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result
        }
    }
    public findOrderStatusLastestByOrderId = async (order_id: number) => {
        let query = `select * from ${this.tableName} where order_id = ? order by id desc limit 1`
        const result = await database.executeQuery(query, [order_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: (result as RowDataPacket[])[0]
        }
    }
    public updateOrderStatus = async (order_id: number, user_id: number, status?: string) => {
        const check = await this.findAllOrderStatusByOrderId(order_id);
        let statusUpdated;
        const created_at = new Date()
        if (check instanceof HttpException)
            return new HttpException(404, errorMessages.NOT_EXISTED);
        if (status == StatusPaymentPurchase.PAID && (check as RowDataPacket).data[0].status != StatusPaymentPurchase.PAID) {
            const result = await this.create({
                order_id: order_id,
                status: StatusPaymentPurchase.PAID,
                user_id: user_id,
                created_at: created_at
            })
            if (result instanceof HttpException) {
                return new HttpException(400, errorMessages.UPLOAD_FAILED);
            }
        }
        else if ((check as RowDataPacket).data.length > 0 && (check as RowDataPacket).data[0].status != StatusPaymentPurchase.PAID) {
            // statusUpdated = (check as RowDataPacket).data[0].status as number + 1;
            const result = await this.create({
                order_id: order_id,
                status: status,
                user_id: user_id,
                created_at: created_at
            })
            if (result instanceof HttpException) {
                return new HttpException(400, errorMessages.UPLOAD_FAILED);
            }
        } else {
            return new HttpException(400, errorMessages.ORDER_STATUS_NOT_ALLOW, "order_id");
        }
        return {
            data: {
                order_id: order_id,
                status: status ? status : statusUpdated,
                user_id: user_id,
                created_at: created_at
            }
        }
    }
    public updateOrderStatusByStatus = async (order_id: number, user_id: number, status: string) => {
        //console.log("status", status);
        //console.log("order_id", order_id);
        //console.log("user_id", user_id);



        const check = await this.findAllOrderStatusByOrderId(order_id);
        const created_at = new Date()
        if (check instanceof HttpException)
            return new HttpException(404, errorMessages.NOT_EXISTED);
        //console.log("check", check);
        // if ((check as RowDataPacket).data.length > 0 && (check as RowDataPacket).data[0].status < status) {
        if ((check as RowDataPacket).data.length > 0) {
            const result = await this.create({
                order_id: order_id,
                status: status,
                user_id: user_id,
                created_at: created_at
            })
            if (result instanceof HttpException) {
                return new HttpException(400, errorMessages.UPLOAD_FAILED);
            }
        } else {
            return new HttpException(400, errorMessages.ORDER_STATUS_NOT_ALLOW, "order_id");
        }
        return {
            data: {
                order_id: order_id,
                status: status,
                user_id: user_id,
                created_at: created_at
            }
        }
    }

    public updateOrderStatusUpdate = async (order_id: number, user_id: number, status: string) => {
        const check = await this.findAllOrderStatusByOrderId(order_id);
        //console.log("check", check);

        let statusUpdated;
        const created_at = new Date()
        if (check instanceof HttpException)
            return new HttpException(404, errorMessages.NOT_EXISTED);

        const resultStatus = await this.create({
            order_id: order_id,
            status: status,
            user_id: user_id,
            created_at: created_at
        })
        if (resultStatus instanceof HttpException) {
            return new HttpException(400, errorMessages.UPLOAD_FAILED);
        }
        return {
            data: {
                order_id: order_id,
                status: status ? status : 0,
                user_id: user_id,
                created_at: created_at
            }
        }
    }

}

export default PurchaseOrderStatusPaymentService;