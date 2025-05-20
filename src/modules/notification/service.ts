import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import forEach from "lodash/forEach";

class NotificationService {

    private tableName = 'notification';
    public create = async (model: CreateDto) => {
        if (model.message instanceof Object && model.message.title && model.message.body) {
            model.message = JSON.stringify(model.message)
        }
        const result = await database.executeQuery(`insert into ${this.tableName} (receiver_id, message, status, notification_type_id, user_id) values (?, ?, ?, ?, ?)`, [model.receiver_id, model.message, model.status || 0, model.notification_type_id, model.user_id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED)
        return {
            data: {
                id: (result as any).insertId,
                ...model
            }
        }
    }
    public update = async (model: CreateDto, id: number) => {
        const updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let query = `update ${this.tableName} set `;
        let params = [];
        if (model.status) {
            query += `status = ?, `;
            params.push(model.status);
        }
        if (model.message) {
            query += `message = ?, `;
            params.push(model.message);
        }
        if (model.notification_type_id) {
            query += `notification_type_id = ?, `;
            params.push(model.notification_type_id);
        }
        query += `updated_at = ? where id = ?`;
        params.push(updated_at);
        params.push(id);
        const result = await database.executeQuery(query, params);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        return {
            data: {
                id: id,
                ...model,
                updated_at: updated_at
            }
        }
    }
    public delete = async (id: number) => {
        if (!await checkExist(this.tableName, 'id', id.toString()))
            return new HttpException(404, errorMessages.GROUP_NOT_EXISTED, 'id');
        const result = await database.executeQuery(`delete from ${this.tableName} where id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            data: {
                message: errorMessages.DELETE_SUCCESS,
                id: id
            }
        }
    }
    public findById = async (id: number) => {
        const result = await checkExist(this.tableName, 'id', id.toString());
        if (result == false)
            return new HttpException(404, errorMessages.GROUP_NOT_EXISTED, 'id');
        return {
            data: (result as any)[0]
        }
    }
    public searchs = async (key: string, message: string, status: boolean, page: number, limit: number, notification_type_id: number, receiver_id: number, user_id: number | null) => {
        let query = `select * from ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;

        if (key && key.length != 0) {
            query += ` and message like '%${key}%'`
            countQuery += ` and message like '%${key}%'`
        }
        if (message && message.length != 0) {
            query += ` and message like '%${message}%'`
            countQuery += ` and message like '%${message}%'`
        }
        if (status != undefined) {
            query += ` and status = ${status}`
            countQuery += ` and status = ${status}`
        }
        if (notification_type_id != undefined) {
            query += ` and notification_type_id = ${notification_type_id}`
            countQuery += ` and notification_type_id = ${notification_type_id}`
        }
        if (receiver_id != undefined) {
            query += ` and receiver_id = ${receiver_id}`
            countQuery += ` and receiver_id = ${receiver_id}`
        }
        if (user_id != undefined) {
            query += ` and user_id = ${user_id}`
            countQuery += ` and user_id = ${user_id}`
        }
        query += ` order by created_at desc`
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
            return new HttpException(404, errorMessages.NOT_FOUND);
        forEach(result, (item: any) => {
            if (item.message && this.isValidJSON(item.message)) {
                item.message = JSON.parse(item.message)
            }
            delete (item as RowDataPacket).receiver_id
            delete (item as RowDataPacket).user_id
        })
        return {
            data: result,
            pagination: pagination
        }
    }
    public updateStatus = async (id: number) => {
        try {
            let result = null;
            let status = 0
            const updated_at = new Date()
            const getStatus = await database.executeQuery(`select status from ${this.tableName} where id = ?`, [id]);
            if ((getStatus as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND, 'id');
            if ((getStatus as RowDataPacket[])[0].status == 0) {
                status = 1
                result = await database.executeQuery(`update ${this.tableName} set status = ?, updated_at = ? where id = ?`, [status, updated_at, id]);
            }
            if ((getStatus as RowDataPacket[])[0].status == 1) {
                result = await database.executeQuery(`update ${this.tableName} set status = ?, updated_at = ? where id = ?`, [status, updated_at, id]);
            }
            return {
                data: {
                    id: id,
                    status: status,
                    updated_at: updated_at
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
    public getNotificationByUserId = async (key: string, message: string, status: boolean, page: number, limit: number, notification_type_id: number, receiver_id: number) => {
        const result = await this.searchs(key, message, status, page, limit, notification_type_id, receiver_id, null);
        if (result instanceof Error && result.field)
            return new HttpException(result.status, result.message, result.field);
        if (result instanceof Error)
            return new HttpException(result.status, result.message);
        return {
            data: result
        }
    }
    private isValidJSON(str: string) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
}

export default NotificationService;