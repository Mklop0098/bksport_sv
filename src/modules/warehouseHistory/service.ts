import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import mysql from "mysql2/promise";
import Ilog from "@core/interfaces/log.interface";

class WarehouseHistoryService {
    private tableName = 'warehouse_history';
    private moduleId = 27;

    public create = async (model: CreateDto) => {
        try {
            const created_at = new Date()
            const updated_at = new Date();
            const log: Ilog = {
                action: errorMessages.CREATE,
                user_id: model.created_id!,
                module_id: this.moduleId,
            }
            const result = await database.executeQueryLog(
                `INSERT INTO ${this.tableName} (product_id, bill_code, branch_id, quantity, created_id, seller_id, quantity_before, quantity_after, type, note, created_at, updated_at) VALUES ( ? , ? , ? , ? , ? , ? , ? , ?, ?, ?, ?, ? )`,
                [
                    model.product_id,
                    model.bill_code || null,
                    model.branch_id,
                    model.quantity,
                    model.created_id,
                    model.seller_id,
                    model.quantity_before,
                    model.quantity_after,   
                    model.type || null,
                    model.note || null,
                    created_at,
                    updated_at,
                ], {
                action: errorMessages.CREATE,
                user_id: model.created_id!,
                module_id: this.moduleId,
            });
            if ((result as any).affectedRows === 0)
                return new HttpException(400, errorMessages.CREATE_FAILED);
            let data = {
                id: (result as any).insertId,
                ...model,
                created_at: created_at,
                updated_at: updated_at
            }
            return {
                data: data
            }
        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED);
        }
    }
    public delete = async (model: CreateDto, id: number) => {
        const checkId = await checkExist(this.tableName, 'id', id.toString());
        if (checkId == false)
            return new HttpException(404, errorMessages.NOT_FOUND)
        const result = await database.executeQuery(`delete from ${this.tableName} where id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: id
        }
    }
    public updateProfile = async (model: CreateDto, id: number) => {
        //console.log(model);

        let result = null;
        const checkId = await checkExist(this.tableName, 'id', id.toString());

        const code = (checkId as any)[0].code;
        const updated_at = new Date()
        let query = `update ${this.tableName} set `;
        let values = [];
        if (model.product_id !== undefined) {
            query += `product_id = ?, `;
            values.push(model.product_id);
        }
        if (model.branch_id !== undefined) {
            query += `branch_id = ?, `;
            values.push(model.branch_id);
        }
        if (model.quantity !== undefined) {
            query += `quantity = ?, `;
            values.push(model.quantity);
        }
        if (model.created_id !== undefined) {
            query += `created_id = ?, `;
            values.push(model.created_id);
        }
        if (model.seller_id !== undefined) {
            query += `seller_id = ?, `;
            values.push(model.seller_id);
        }
        if (model.quantity_before !== undefined) {
            query += `quantity_before = ?, `;
            values.push(model.quantity_before);
        }
        if (model.quantity_after !== undefined) {
            query += `quantity_after = ?, `;
            values.push(model.quantity_after);
        }
        if (model.type !== undefined) {
            query += `type = ?, `;
            values.push(model.type);
        }
        if (model.note !== undefined) {
            query += `note = ?, `;
            values.push(model.note);
        }
        query += `updated_at = ? WHERE id = ?`;
        values.push(updated_at);
        values.push(id);
        let log: Ilog = {
            action: errorMessages.UPDATE,
            user_id: model.created_id!,
            module_id: this.moduleId,
        }
        try {
            result = await database.executeQueryLog(query, values, log);
            if ((result as mysql.ResultSetHeader).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            let data = {
                id: id,
                ...model,
                code: code,
                updated_at: updated_at
            }
            return {
                data: data
            };
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        }
    }
    public async findById(id: number) {
        let query = `select *  from ${this.tableName} where id = ?`;
        const result = await database.executeQuery(query, [id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: {
                ...(result as any)[0],
            }
        }
    }
    public addCollate = async (query: string) => {
        return query.replace(/(s\.\w+)/g, (match) => `${match} COLLATE utf8mb4_general_ci`);
    }
    public searchs = async (key: string, product_id: number, supplier_id: number, branch_id: number, quantity: number, status: boolean, page: number, limit: number, seller_id: number) => {
        let query = `select * from ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) AS total 
                          FROM ${this.tableName} 
                          WHERE 1=1`;
        // if (key && key.length !== 0) {
        //     query += ` AND (product_id LIKE '%${key}%' OR s.phone LIKE '%${key}%' OR s.email LIKE '%${key}%')`;
        //     countQuery += ` AND (product_id LIKE '%${key}%' OR s.phone LIKE '%${key}%' OR s.email LIKE '%${key}%')`;
        // }
        if (product_id  != undefined) {
            query += ` AND product_id LIKE '%${product_id}%'`;
            countQuery += ` AND product_id LIKE '%${product_id}%'`;
        }
        if (supplier_id  != undefined) {
            query += ` AND supplier_id LIKE '%${supplier_id}%'`;
            countQuery += ` AND supplier_id LIKE '%${supplier_id}%'`;
        }
        if (branch_id  != undefined) {
            query += ` AND branch_id LIKE '%${branch_id}%'`;
            countQuery += ` AND branch_id LIKE '%${branch_id}%'`;
        }
        if (quantity  != undefined) {
            query += ` AND quantity LIKE '%${quantity}%'`;
            countQuery += ` AND quantity LIKE '%${quantity}%'`;
        }
        query += ` ORDER BY s.id DESC`;

        if (page && (page < 1 || limit < 1)) {
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        }
        if (page && limit) {
            query += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
        }
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
            const getstatus = await database.executeQuery(`select status from ${this.tableName} where id = ?`, [id]);
            if ((getstatus as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND, 'id');
            if ((getstatus as RowDataPacket[])[0].status == 0) {
                status = 1
                result = await database.executeQuery(`update ${this.tableName} set status = ?, updated_at = ? where id = ?`, [status, update_at, id]);
            }
            if ((getstatus as RowDataPacket[])[0].status == 1) {
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

    public statistics = async () => {
        let countQuery = `SELECT 
            COUNT(CASE WHEN status = 1 THEN 1 END) AS totalstatus,
            COUNT(CASE WHEN status = 0 THEN 1 END) AS totalUnstatus,
            COUNT(*) AS total
        FROM ${this.tableName};`;
        const result = await database.executeQuery(countQuery);
        return (result as RowDataPacket[])[0];
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

}
export default WarehouseHistoryService;