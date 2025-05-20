import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";

class UserRoleService {

    private tableName = 'user_role';
    public create = async (model: CreateDto) => {
        const checkUser = await checkExist('users', 'id', model.user_id!.toString());
        if (checkUser == false)
            return new HttpException(404, errorMessages.USER_NOT_EXISTED, 'user_id');
        const checkRole = await checkExist('role', 'id', model.role_id!.toString());
        if (checkRole == false)
            return new HttpException(404, errorMessages.ROLE_NOT_EXISTED, 'role_id');
        const created_at = new Date()
        const updated_at = new Date()
        const result = await database.executeQuery(`insert into ${this.tableName} (user_id, role_id, created_id, created_at, updated_at, seller_id) values (?, ?, ?, ? , ?, ?)`, [model.user_id, model.role_id, model.created_id, created_at, updated_at, model.seller_id || 0]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED)
        return {
            data: {
                id: (result as any).insertId,
                ...model,
                created_at: created_at,
                updated_at: updated_at
            }
        }
    }
    public update = async (model: CreateDto, id: number) => {
        const updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let query = `update ${this.tableName} set `;
        let params = [];
        if (model.user_id) {
            query += `user_id = ?, `;
            params.push(model.user_id);
        }
        if (model.role_id) {
            query += `role_id = ?, `;
            params.push(model.role_id);
        }
        if(model.seller_id != undefined){
            query += `seller_id = ?, `;
            params.push(model.seller_id);
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
                model: model,
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
    public searchs = async (key: string, user_id: number, role_id: number, page: number, limit: number, seller_id: number) => {
        let query = `select * from ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;
        if (user_id !== undefined) {
            query += ` and user_id = ?`;
            countQuery += ` and user_id = ?`;
        }
        if (role_id !== undefined) {
            query += ` and role_id = ?`;
            countQuery += ` and role_id = ?`;
        }
        if(seller_id !== undefined){
            query += ` and seller_id = ?`;
            countQuery += ` and seller_id = ?`;
        }
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
    public deleteRows = async (data: number[]) => {
        let query = `delete from ${this.tableName} where id in (${data})`
        const result = await database.executeQuery(query);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS
        }
    }
    public getRoleByUserId = async (user_id: number) => {
        let query = `select * from ${this.tableName} where user_id = ?`;
        const result = await database.executeQuery(query, [user_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result
        }
    }
    public findByUserId = async (user_id: number) => {
        let query = `select * from ${this.tableName} where user_id = ?`;
        const result = await database.executeQuery(query, [user_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND , 'user_id');
        return {
            data: result
        }
    }
}

export default UserRoleService;