import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { StatusOrder } from "@modules/purchaseOrder/interface";
import { convertPushlishNumberToOrderStatus } from "@modules/purchaseOrder/utils";
import Ilog from "@core/interfaces/log.interface";

class PurchaseOrderStatusService {
    private tableName = 'purchase_order_status_history';
    private fieldId = 'id'
    
    public getDes = async (status: string, reference_id: number) => {
        if (status == StatusOrder.NEW) {
            const exist = await database.executeQuery(`select * from action_history where reference_id = ? and action = 'create' and module_id = 33`, [reference_id]) as RowDataPacket
            if (exist.length > 0) {
                return `đã chỉnh sửa đơn nhập hàng`
            }
            else {
                return `đã tạo một đơn nhập hàng`
            }
        }
        if (status == StatusOrder.APPROVE) {
            return `đã duyệt đơn nhập hàng`
        }
        if (status == StatusOrder.NOT_APPROVE) {
            return `đã không duyệt đơn nhập hàng`
        }
        if (status == StatusOrder.CONFIRM) {
            return `đã xác nhận đơn nhập hàng`
        }
        if (status == StatusOrder.NOT_CONFIRM) {
            return `đã không xác nhận đơn nhập hàng`
        }
        if (status == StatusOrder.IMPORT) {
            return `đã nhập hàng`
        }
        if (status == StatusOrder.COMPLETED) {
            return `đã hoàn thành đơn nhập hàng`
        }
        if (status == StatusOrder.CREATE_VARIANT) {
            return `đã tạo đơn nhập kho đầu kỳ`
        }
        if (status == StatusOrder.CANCEL) {
            return `đã hủy đơn nhập hàng`
        }
        
    }
    private getAction = (status: string) => {
        if (status == StatusOrder.NEW) {
            return `create`
        }
        if (status == StatusOrder.CREATE_VARIANT) {
            return `create_variant`
        }
        if (status == StatusOrder.APPROVE) {
            return `approve`
        }
        if (status == StatusOrder.NOT_APPROVE) {
            return `not_approve`
        }
        if (status == StatusOrder.CONFIRM) {
            return `confirm`
        }
        if (status == StatusOrder.NOT_CONFIRM) {
            return `not_confirm`
        }
        if (status == StatusOrder.IMPORT) {
            return `import`
        }
        if (status == StatusOrder.COMPLETED) {
            return `completed`
        }
        if (status == StatusOrder.CANCEL) {
            return `cancel`
        }
        return 'update'
    }

    public create = async (model: CreateDto) => {
       //console.log("model order status", model);

        let query = `insert into ${this.tableName} (order_id, status, created_at, user_id, seller_id, branch_id) values (?, ?, ?, ?, ?, ?)`
        const created_at = new Date()
        const values = [
            model.order_id,
            model.status || StatusOrder.NEW,
            created_at || null,
            model.user_id,
            model.seller_id,
            model.branch_id
        ]
       console.log(query, values)
       let log: Ilog = {
        user_id: model.user_id!,
        action: this.getAction(model.status!),
        module_id: 33,
        des: await this.getDes(model.status!, model.order_id!),
        reference_id: model.order_id,
        reason: model.reason
       }
       console.log('log', log)
        const result = await database.executeQueryHistory(query, values, log);
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
        if (model.order_id) {
            query += `order_id = ?,`
            values.push(model.order_id)
        }
        if (model.status) {
            query += `status = ?,`
            values.push(model.status)
        }
        if (model.user_id) {
            query += `user_id = ?,`
            values.push(model.user_id)
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
    // public updateStatus = async (id: number) => {
    //     try {
    //         let result = null;
    //         let status = 0
    //         const update_at = new Date()
    //         const getStatus = await database.executeQuery(`select status from ${this.tableName} where id = ?`, [id]);
    //         if ((getStatus as RowDataPacket[]).length === 0)
    //             return new HttpException(404, errorMessages.NOT_FOUND);
    //         if ((getStatus as RowDataPacket[])[0].status == 0) {
    //             status = 1
    //             result = await database.executeQuery(`update ${this.tableName} set status = ?, updated_at = ? where id = ?`, [status, update_at, id]);
    //         }
    //         if ((getStatus as RowDataPacket[])[0].status == 1) {
    //             result = await database.executeQuery(`update ${this.tableName} set status = ?, updated_at = ? where id = ?`, [status, update_at, id]);
    //         }
    //         return {
    //             data: {
    //                 id: id,
    //                 status: status,
    //                 updated_at: update_at
    //             }
    //         }
    //     }
    //     catch (error) {
    //         return new HttpException(500, errorMessages.UPDATE_FAILED);
    //     }
    // }
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
        const resultListOrder = await database.executeQuery(query, [order_id]);
        if (Array.isArray(resultListOrder) && resultListOrder.length == 0)
            return new HttpException(404, errorMessages.NOT_FOUND + " order_id");
        const result = (resultListOrder as RowDataPacket).map((item: any) => {
            return {
                ...item,
                status_name: convertPushlishNumberToOrderStatus(item.status)
            }
        })
        return {
            data: result
        }
    }
    public findAllStatusByOrderId = async (order_id: number) => {
        let query = `select * from ${this.tableName} where order_id = ? order by id desc`
        let data = {
            created_at: null,
            imported_at: null,
            // processing_at: null,
            // packing_at: null,
            // delivering_at: null,
            completed_at: null,
            canceled_at: null
        }
        const result = await database.executeQuery(query, [order_id]);
        for (let i = 0; i < (result as RowDataPacket[]).length && i < 4; i++) {
            if ((result as RowDataPacket[])[i].status == StatusOrder.NEW)
                data.created_at = (result as RowDataPacket[])[i].created_at
            if ((result as RowDataPacket[])[i].status == StatusOrder.IMPORT)
                data.imported_at = (result as RowDataPacket[])[i].created_at
            if ((result as RowDataPacket[])[i].status == StatusOrder.COMPLETED)
                data.completed_at = (result as RowDataPacket[])[i].created_at
            if ((result as RowDataPacket[])[i].status == StatusOrder.CANCEL)
                data.canceled_at = (result as RowDataPacket[])[i].created_at
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
        if (status == StatusOrder.COMPLETED && (check as RowDataPacket).data[0].status != StatusOrder.COMPLETED) {
            const result = await this.create({
                order_id: order_id,
                status: StatusOrder.COMPLETED,
                user_id: user_id,
                created_at: created_at
            })
            if (result instanceof HttpException) {
                return new HttpException(400, errorMessages.UPLOAD_FAILED);
            }
        }
        else if ((check as RowDataPacket).data.length > 0 && (check as RowDataPacket).data[0].status != StatusOrder.COMPLETED) {
            // else if ((check as RowDataPacket).data.length > 0 && (check as RowDataPacket).data[0].status < 3) {
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
                // status: status ? status : statusUpdated,
                status: status ? status : 0,
                user_id: user_id,
                created_at: created_at
            }
        }
    }

}

export default PurchaseOrderStatusService;