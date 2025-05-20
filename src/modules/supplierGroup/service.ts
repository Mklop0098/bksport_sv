import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar } from "@core/utils/gennerate.code";

class SupplierGroupService {
    private tableName = '`supplier-group`';
    private moduleId = 1;

    public create = async (model: CreateDto) => {
        const user = await database.executeQuery(`SELECT id from ${this.tableName} WHERE name = ? and seller_id = ?`, [model.name, model.seller_id]) as RowDataPacket
        if (user.length > 0) 
            return new HttpException(400, errorMessages.EXISTED, 'name');
        let code = model.code
        if (code && code.length > 0) {
            if (await checkExist(this.tableName, 'code', code))
                return new HttpException(400, errorMessages.EXISTED, 'code');
        } else {
            code = await generateCodePrefixChar(this.tableName, 'SGN', 8)
        }
        const created_at = new Date()
        const updated_at = new Date()
        const result = await database.executeQueryLog(`insert into ${this.tableName} (name, publish, created_id, created_at, updated_at, code, seller_id ) values (?, ?, ? , ?, ?, ?, ?)`, [model.name, model.publish ?? 1, model.created_id, created_at, updated_at, code, model.seller_id], {
            action: errorMessages.CREATE,
            user_id: model.created_id!,
            module_id: this.moduleId,
        });
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED)
        return {
            data: {
                id: (result as any).insertId,
                ...model,
                created_at: created_at,
                updated_at: updated_at,
                code: code
            }
        }
    }
    public update = async (model: CreateDto, id: number) => {
        if (!await checkExist(this.tableName, 'id', id.toString()))
            return new HttpException(400, errorMessages.GROUP_NOT_EXISTED, 'id');
        const exist = await database.executeQuery(
            `SELECT id as idx from ${this.tableName} where name = ? and seller_id = ?`,
            [model.name, model.seller_id]
        ) as RowDataPacket
        if (exist.length > 0 && exist[0].idx != id) {
            return new HttpException(400, errorMessages.GROUP_NAME_EXISTED, 'name');
        }
        const update_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let query = `update ${this.tableName} set `;
        let params = [];
        if (model.publish != undefined) {
            query += `publish = ?, `;
            params.push(model.publish);
        }
        if (model.name != undefined) {
            query += `name = ?, `;
            params.push(model.name);
        }
        if(model.seller_id != undefined){
            query += `seller_id = ?, `;
            params.push(model.seller_id);
        }
        query += `updated_at = ? where id = ?`;
        params.push(update_at);
        params.push(id);
        const result = await database.executeQueryLog(query, params, {
            action: errorMessages.UPDATE,
            user_id: model.created_id!,
            module_id: this.moduleId,
        })
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        return {
            data: {
                id: id,
                name: model.name,
                publish: model.publish,
                updated_at: update_at
            }
        }
    }
    public delete = async (model: CreateDto, id: number) => {
        if (!await checkExist(this.tableName, 'id', id.toString()))
            return new HttpException(400, errorMessages.GROUP_NOT_EXISTED, 'id');
        const result = await database.executeQueryLog(`delete from ${this.tableName} where id = ?`, [id], {
            action: errorMessages.DELETE,
            user_id: model.created_id!,
            module_id: this.moduleId,
        });
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: id
        }
    }
    public findById = async (id: number) => {
        const result = await checkExist(this.tableName, 'id', id.toString());
        if (result == false)
            return new HttpException(400, errorMessages.GROUP_NOT_EXISTED);
        return {
            data: (result as any)[0]
        }
    }

    public searchs = async (key: string, name: string, publish: boolean, page: number, limit: number, code: string, seller_id: number) => {
        let query = `select * from ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;

        if (key != undefined) {
            query += ` and name like '%${key}%'`
            countQuery += ` and name like '%${key}%'`
        }
        if (name != undefined) {
            query += ` and name like '%${name}%'`
            countQuery += ` and name like '%${name}%'`
        }
        if (publish != undefined) {
            query += ` and publish = ${publish}`
            countQuery += ` and publish = ${publish}`
        }
        if (code != undefined) {
            query += ` and code = ${code}`
            countQuery += ` and code = ${code}`
        }
        if(seller_id != undefined){
            query += ` and seller_id = ${seller_id}`
            countQuery += ` and seller_id = ${seller_id}`
        }
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
            return new HttpException(400, errorMessages.NOT_FOUND);
        return {
            data: result,
            pagination: pagination
        }
    }
    public updatePublish = async (model: CreateDto, id: number) => {
        try {
            let result = null;
            let publish = 0
            const update_at = new Date()
            const getPublish = await database.executeQuery(`select publish from ${this.tableName} where id = ?`, [id]);
            if ((getPublish as RowDataPacket[]).length === 0)
                return new HttpException(400, errorMessages.NOT_FOUND, 'id');
            if ((getPublish as RowDataPacket[])[0].publish == 0) {
                publish = 1
                result = await database.executeQueryLog(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publish, update_at, id], {
                    action: errorMessages.UPDATE_STATUS,
                    user_id: model.created_id!,
                    module_id: this.moduleId,
                });
            }
            if ((getPublish as RowDataPacket[])[0].publish == 1) {
                result = await database.executeQueryLog(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publish, update_at, id], {
                    action: errorMessages.UPDATE_STATUS,
                    user_id: model.created_id!,
                    module_id: this.moduleId,
                });
            }
            return {
                data: {
                    id: id,
                    publish: publish,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public updateDefault = async (model: CreateDto, id: number) => {
        try {
            let result = null;
            let is_default = 0
            const update_at = new Date()
            const getIsDefault = await database.executeQuery(`select is_default from ${this.tableName} where id = ?`, [id]);
            if ((getIsDefault as RowDataPacket[]).length === 0)
                return new HttpException(400, errorMessages.NOT_FOUND, 'id');
            if ((getIsDefault as RowDataPacket[])[0].is_default == 0) {
                is_default = 1
                result = await database.executeQueryLog(`update ${this.tableName} set is_default = ?, updated_at = ? where id = ?`, [is_default, update_at, id], {
                    action: errorMessages.UPDATE_STATUS,
                    user_id: model.created_id!,
                    module_id: this.moduleId,
                });
            }
            if ((getIsDefault as RowDataPacket[])[0].is_default == 1) {
                result = await database.executeQueryLog(`update ${this.tableName} set is_default = ?, updated_at = ? where id = ?`, [is_default, update_at, id], {
                    action: errorMessages.UPDATE_STATUS,
                    user_id: model.created_id!,
                    module_id: this.moduleId,
                });
            }
            return {
                data: {
                    id: id,
                    is_default: is_default,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public deleteRows = async (model: CreateDto, data: number[]) => {
        let query = `delete from ${this.tableName} where id in (${data})`
        const result = await database.executeQueryLog(query, undefined, {
            action: errorMessages.DELETE_LIST,
            user_id: model.created_id!,
            module_id: this.moduleId,
            des: {
                id: data
            }
        });
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            data: {
                message: errorMessages.DELETE_SUCCESS
            }
        }
    }
    public updateListPublish = async (model: CreateDto, data: number[], publish: number) => {
        try {
            let result = null;
            const update_at = new Date()
            let query = `update ${this.tableName} set publish = ?, updated_at = ? where id in (${data})`
            result = await database.executeQueryLog(query, [publish, update_at], {
                action: errorMessages.UPDATE_LIST_STATUS,
                user_id: model.created_id!,
                module_id: this.moduleId,
                des: {
                    id: data,
                    publish: publish
                }
            });
            return {
                data: {
                    publish: publish,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
}

export default SupplierGroupService;