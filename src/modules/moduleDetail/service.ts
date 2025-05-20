import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";

class ModuleDetailService {
    private tableName = 'module_detail';
    public create = async (model: CreateDto) => {
        // if (await checkExist(this.tableName, 'action', model.action) && await checkExist(this.tableName, 'module_id', model.module_id.toString()) && await checkExist(this.tableName, 'role_id', model.role_id.toString()))
        // return new HttpException(400, errorMessages.EXISTED, 'action');
        let name = model.name;
        // if (model.action != undefined) {
        //     name = this.generateNameByAction(model.action) as string;
        // }
        const created_at = new Date()
        const updated_at = new Date()
        const result = await database.executeQuery(`insert into ${this.tableName} (name, created_id, created_at, updated_at, module_id, action, sort, seller_id ) values (? , ?, ?, ?, ? , ?, ?, ?)`, [name, model.created_id, created_at, updated_at, model.module_id, model.action, model.sort, model.seller_id]);
        //console.log("result DETAIL", result);

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
        // if (await checkExist(this.tableName, 'action', model.action, id.toString() && await checkExist(this.tableName, 'module_id', model.module_id.toString(), id.toString()) && await checkExist(this.tableName, 'role_id', model.role_id.toString(), id.toString())))
        // return new HttpException(400, errorMessages.EXISTED, 'action');
        const update_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let query = `update ${this.tableName} set `;
        let params = [];
        if (model.module_id != undefined) {
            query += `module_id = ?, `;
            params.push(model.module_id);
        }
        if (model.action != undefined) {
            if (!this.checkActionModel(model.action)) {
                return new HttpException(400, errorMessages.INVALID_ACTION);
            }
            // const name = this.generateNameByAction(model.action)
            let name = model.name;
            query += `action = ?, `;
            params.push(model.action);
            query += `name = ?, `;
            params.push(name);
        }
        if (model.seller_id != undefined) {
            query += `seller_id = ?, `;
            params.push(model.seller_id);
        }
        query += `updated_at = ? where id = ?`;
        params.push(update_at);
        params.push(id);
        const result = await database.executeQuery(query, params);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        return {
            data: {
                id: id,
                name: model.name,
                // status: model.status,
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
            return new HttpException(400, errorMessages.GROUP_NOT_EXISTED);
        return {
            data: (result as any)[0]
        }
    }

    public searchs = async (key: string, name: string, status: boolean, page: number, limit: number, module_id: number, action: string, role_id: number, seller_id: number) => {
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
        if (status != undefined) {
            query += ` and status = ${status}`
            countQuery += ` and status = ${status}`
        }
        if (module_id != undefined) {
            query += ` and module_id = ${module_id}`
            countQuery += ` and module_id = ${module_id}`
        }
        if (action != undefined) {
            query += ` and action = '${action}'`
            countQuery += ` and action = '${action}'`
        }
        if (role_id != undefined) {
            query += ` and role_id = ${role_id}`
            countQuery += ` and role_id = ${role_id}`
        }
        if (seller_id != undefined) {
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
    public updateStatus = async (id: number) => {
        try {
            let result = null;
            let status = 0
            const update_at = new Date()
            const getstatus = await database.executeQuery(`select status from ${this.tableName} where id = ?`, [id]);
            if ((getstatus as RowDataPacket[]).length === 0)
                return new HttpException(400, errorMessages.NOT_FOUND, 'id');
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
    public checkActionModel = async (action: string) => {
        if (action == errorMessages.ACTION_CREATE_VALUE || action == errorMessages.ACTION_UPDATE_VALUE || action == errorMessages.ACTION_DELETE_VALUE || action == errorMessages.ACTION_INDEX_VALUE)
            return true
    }

    public findModuleDetailByModuleId = async (module_id: number) => {
        const result = await database.executeQuery(`select * from ${this.tableName} where module_id = ? and status = 1`, [module_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.NOT_FOUND);
        return {
            data: result
        }
    }

    public findModuleDetailByRoleId = async (role_id: number) => {
        const result = await database.executeQuery(`select * from ${this.tableName} where role_id = ? and status = 1`, [role_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.NOT_FOUND);
        return {
            data: result
        }
    }
    public generateNameByAction = (action: string) => {
        if (action == errorMessages.ACTION_CREATE_VALUE)
            return errorMessages.ACTION_CREATE
        if (action == errorMessages.ACTION_UPDATE_VALUE)
            return errorMessages.ACTION_UPDATE
        if (action == errorMessages.ACTION_DELETE_VALUE)
            return errorMessages.ACTION_DELETE
        if (action == errorMessages.ACTION_INDEX_VALUE)
            return errorMessages.ACTION_INDEX
        
        return action

    }

    // sua lai
    public findAllModuleDetailByModuleId = async (module_id: number) => {
        const result = await database.executeQuery(`select * from ${this.tableName} where module_id = ? order by sort desc`, [module_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.NOT_FOUND);
        return {
            data: result
        }
    }

    public deleteAllModuleDetailByModuleId = async (module_id: number) => {
        const getAllModuleDetail = await database.executeQuery(`select * from ${this.tableName} where module_id = ?`, [module_id]);
        if (Array.isArray(getAllModuleDetail) && getAllModuleDetail.length === 0)
            return new HttpException(400, errorMessages.NOT_FOUND);
        const moduleDetailId = (getAllModuleDetail as RowDataPacket).map((item: any) => item.id);
        try {
            for (let i = 0; i < moduleDetailId.length; i++) {
                await this.deleteModuleDetailById(moduleDetailId[i]);
            }
        } catch (error) { }
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: module_id
        }
    }

    public deleteModuleDetailById = async (id: number) => {
        const result = await database.executeQuery(`delete from ${this.tableName} where id = ?`, [id]);
        if ((result as any).affectedRows === 0) { } else {
            try {
                await this.deleleteAllPermissionByModuleDetailId(id);
            } catch (error) { }
        }
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: id
        }
    }
    public deleleteAllPermissionByModuleDetailId = async (module_detail_id: number) => {
        const result = await database.executeQuery(`delete from permission where module_detail_id = ?`, [module_detail_id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: module_detail_id
        }
    }
}

export default ModuleDetailService;