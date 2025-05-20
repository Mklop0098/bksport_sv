import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import ModuleDetailService from "@modules/moduleDetail/service";

class ModuleService {
    private tableName = 'module';
    private moduleDetailService = new ModuleDetailService()

    public create = async (model: CreateDto) => {
        if (await checkExist(this.tableName, 'name', model.name))
            return new HttpException(400, errorMessages.EXISTED, 'name');
        const created_at = new Date()
        const updated_at = new Date()
        const result = await database.executeQuery(`insert into ${this.tableName} (name, publish, created_id, created_at, updated_at , seller_id, url) values (?, ?, ? , ?, ?, ?, ?)`, [model.name, model.publish ?? 1, model.created_id, created_at, updated_at, model.seller_id || 0, model.url]);
        if (model.actions != undefined && model.actions.length > 0) {
            for (let i = 0; i < model.actions.length; i++) {
                await this.moduleDetailService.create({
                    module_id: (result as any).insertId,
                    action: model.actions[i].action,
                    sort: model.actions[i].sort,
                    created_id: model.created_id,
                    name:model.actions[i].name,
                    seller_id: model.seller_id || 0
                })
            }
        }
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED)
        return {
            data: {
                id: (result as any).insertId,
                ...model,
                created_at: created_at,
                updated_at: updated_at,
            }
        }
    }
    public update = async (model: CreateDto, id: number) => {
        if (!await checkExist(this.tableName, 'id', id.toString()))
            return new HttpException(400, errorMessages.NOT_EXISTED, 'id');
        if (await checkExist(this.tableName, 'name', model.name, id.toString()))
            return new HttpException(400, errorMessages.EXISTED, 'name');
        const update_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let query = `update ${this.tableName} set `;
        let params = [];
        if (model.publish != undefined) {
            query += `publish = ?, `;
            params.push(model.publish);
        }
        if (model.url != undefined) {
            query += `url = ?, `;
            params.push(model.url);
        }
        if (model.name != undefined) {
            query += `name = ?, `;
            params.push(model.name);
        }
        if (model.actions != undefined && model.actions.length > 0) {
            const deleteModuleDetail = await this.moduleDetailService.deleteAllModuleDetailByModuleId(id);
            if (deleteModuleDetail instanceof Error) {
            }
            for (let i = 0; i < model.actions.length; i++) {
                await this.moduleDetailService.create({
                    module_id: id,
                    action: model.actions[i].action || '',
                    sort: model.actions[i].sort || 0,
                    created_id: model.created_id || 0,
                    seller_id: model.seller_id || 0,
                    name:model.actions[i].name
                })
            }
        }
        if(model.seller_id != undefined){
            query += `seller_id = ?, `;
            params.push(model.seller_id);
        }
        query += `updated_at = ? where id = ?`;
        params.push(update_at);
        params.push(id);
        const result = await database.executeQuery(query, params);
        //console.log("result module", result);
        
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
    public delete = async (id: number) => {
        if (!await checkExist(this.tableName, 'id', id.toString()))
            return new HttpException(400, errorMessages.GROUP_NOT_EXISTED, 'id');
        const result = await database.executeQuery(`delete from ${this.tableName} where id = ?`, [id]);
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
            return new HttpException(400, errorMessages.NOT_FOUND);

        // module detail
        const resultDetail = await this.moduleDetailService.findAllModuleDetailByModuleId(id)
        if (resultDetail instanceof Error) { } else {
            (result as any)[0].actions = resultDetail.data
        }
        return {
            data: (result as any)[0]
        }
    }

    public searchs = async (key: string, name: string, publish: boolean, page: number, limit: number, code: string, seller_id : number) => {
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
       //console.log(query)
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
    public updatePublish = async (id: number) => {
        try {
            let result = null;
            let publish = 0
            const update_at = new Date()
            const getPublish = await database.executeQuery(`select publish from ${this.tableName} where id = ?`, [id]);
            if ((getPublish as RowDataPacket[]).length === 0)
                return new HttpException(400, errorMessages.NOT_FOUND, 'id');
            if ((getPublish as RowDataPacket[])[0].publish == 0) {
                publish = 1
                result = await database.executeQuery(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publish, update_at, id]);
            }
            if ((getPublish as RowDataPacket[])[0].publish == 1) {
                result = await database.executeQuery(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publish, update_at, id]);
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
    public deleteRows = async (data: number[]) => {
        let query = `delete from ${this.tableName} where id in (${data})`
        const result = await database.executeQuery(query);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            data: {
                message: errorMessages.DELETE_SUCCESS
            }
        }
    }
    public updateListPublish = async (data: number[], publish: number) => {
        try {
            let result = null;
            const update_at = new Date()
            let query = `update ${this.tableName} set publish = ?, updated_at = ? where id in (${data})`
            result = await database.executeQuery(query, [publish, update_at]);
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

    public getModuleIdByUrl = async (url: string) => {
        try {
            const query = `SELECT id from module where url = ?`
            const id = await database.executeQuery(query, [url]) as RowDataPacket
            if (id.length > 0) {
                return id[0].id
            }
            else {
                return new HttpException(404, errorMessages.NOT_FOUND, 'url');
            }
        }
        catch (error) {
            return new HttpException(404, errorMessages.NOT_FOUND, 'url');
        }
    }
}

export default ModuleService;