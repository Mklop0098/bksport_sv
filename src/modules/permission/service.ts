import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import UserRoleService from "@modules/userRole/service";
import ModuleDetailService from "@modules/moduleDetail/service";
import { IAction, EAction, EActionValue } from "./interface";

class PermissionService {
    private tableName = 'permission';

    public userRoleService = new UserRoleService();
    public moduleDetailService = new ModuleDetailService();

    public create = async (model: CreateDto) => {
        const created_at = new Date()
        const updated_at = new Date()
        const result = await database.executeQuery(`insert into ${this.tableName} (status, created_id, created_at, updated_at, module_detail_id, role_id ) values (? , ?, ?, ?, ? , ?)`, [model.status ?? 1, model.created_id, created_at, updated_at, model.module_detail_id, model.role_id]);
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

    public createAndUpdate = async (model: CreateDto) => {
        //console.log();

        if (!model.module_detail_id || !model.role_id || model.status == undefined) {
            return new HttpException(400, errorMessages.MISSING_DATA);
        }
        let queryCheckExist = `select * from ${this.tableName} where module_detail_id = ? and role_id = ?`
        const checkExist = await database.executeQuery(queryCheckExist, [model.module_detail_id, model.role_id]);
        if (Array.isArray(checkExist) && (checkExist as RowDataPacket[]).length != 0) {
            try {
                let update = await database.executeQuery(`update ${this.tableName} set status = ? where id = ?`, [model.status, (checkExist as RowDataPacket)[0].id]);
            } catch (error) { }
        } else {
            try {
                const resultCreate = await this.create(model);
                if (resultCreate instanceof HttpException) {
                    return new HttpException(400, errorMessages.CREATE_FAILED);
                }
                return {
                    data: {
                        id: (resultCreate as any).data.id,
                        ...model,
                        created_at: (resultCreate as any).data.created_at,
                        updated_at: (resultCreate as any).data.updated_at,
                    }
                }
            } catch (error) { }
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

    public searchs = async (key: string, name: string, status: boolean, page: number, limit: number, module_detail_id: number, action: string, role_id: number) => {
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
        if (module_detail_id != undefined) {
            query += ` and module_detail_id = ${module_detail_id}`
            countQuery += ` and module_detail_id = ${module_detail_id}`
        }
        if (action != undefined) {
            query += ` and action = '${action}'`
            countQuery += ` and action = '${action}'`
        }
        if (role_id != undefined) {
            query += ` and role_id = ${role_id}`
            countQuery += ` and role_id = ${role_id}`
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
        if (action == errorMessages.ACTION_CREATE_VALUE || action == errorMessages.ACTION_UPDATE_VALUE || action == errorMessages.ACTION_DELETE_VALUE || action == errorMessages.ACTION_INDEX_VALUE || action == errorMessages.ACTION_EXPORT_VALUE || action == errorMessages.ACTION_IMPORT_VALUE || action == errorMessages.ACTION_PUBLISH_VALUE || action == errorMessages.ACTION_REPORT_VALUE)
            return true
    }

    public findPermissionByModuleId = async (module_detail_id: number) => {
        const result = await database.executeQuery(`select * from ${this.tableName} where module_detail_id = ? and status = 1`, [module_detail_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.NOT_FOUND);
        return {
            data: result
        }
    }

    public findPermissionByRoleId = async (role_id: number) => {
        const result = await database.executeQuery(`select * from ${this.tableName} where role_id = ? and status = 1`, [role_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.NOT_FOUND);
        return {
            data: result
        }
    }
    public findAllActionByRoleId = async (role_id: number) => {
        const result = await database.executeQuery(`select * from ${this.tableName} where role_id = ?`, [role_id]);
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
        if (action == errorMessages.ACTION_PUBLISH_VALUE)
            return errorMessages.ACTION_PUBLISH
        if (action == errorMessages.ACTION_IMPORT_VALUE)
            return errorMessages.ACTION_IMPORT
        if (action == errorMessages.ACTION_EXPORT_VALUE)
            return errorMessages.ACTION_EXPORT
        if (action == errorMessages.ACTION_REPORT_VALUE)
            return errorMessages.ACTION_REPORT
    }


    //check permission
    public checkPermissionOfUserId = async (user_id: number, list_role_name: string[], module_detail_id: number, action: string) => {
        let listRoleId: number[] = [];
        for (let i = 0; i < list_role_name.length; i++) {
            let role = await checkExist('role', 'name', list_role_name[i]);
            if (role == false) { } else listRoleId.push((role as RowDataPacket)[0].id);
        }
        const result = await this.findPermissionOfUserId(user_id);
        if ((result instanceof HttpException || (result as RowDataPacket).data.length === 0)) {
            return false
        } else {
            for (let i = 0; i < (result as RowDataPacket).data.length; i++) {
                for (let j = 0; j < listRoleId.length; j++) {
                    if ((result as RowDataPacket).data[i].role_id == listRoleId[j]) {
                        for (let k = 0; k < (result as RowDataPacket).data[i].permissions.length; k++) {
                            if ((result as RowDataPacket).data[i].permissions[k].module_detail_id == module_detail_id && (result as RowDataPacket).data[i].permissions[k].action == action) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    //find all permission of user id
    public findPermissionOfUserId = async (user_id: number) => {
        const findAllRolos = await this.userRoleService.getRoleByUserId(user_id);
        if (findAllRolos instanceof Error || (findAllRolos as RowDataPacket).data.length == 0) {
            return {
                data: []
            }
        }
        let roles = [];
        for (let i = 0; i < (findAllRolos as RowDataPacket).data.length; i++) {
            const role = await this.findPermissionByRoleId((findAllRolos as RowDataPacket).data[i].role_id);
            const module = {
                role_id: (findAllRolos as RowDataPacket).data[i].role_id,
                role_name: (findAllRolos as RowDataPacket).data[i].role_name,
                permissions: (role as RowDataPacket).data
            }
            roles.push(module)
        }
        return {
            data: roles
        }
    }

    // public checkPermissionByUserId = async (user_id: number, role_id: number, module_detail_id: number, action: string) => {
    //     const result = await this.findPermissionOfUserId(user_id)
    //     if ((result as RowDataPacket).data.length === 0) {
    //         return false
    //     } else {
    //         for (let i = 0; i < (result as RowDataPacket).data.length; i++) {
    //             if ((result as RowDataPacket).data[i].role_id == role_id) {
    //                 for (let j = 0; j < (result as RowDataPacket).data[i].permissions.length; j++) {
    //                     if ((result as RowDataPacket).data[i].permissions[j].module_detail_id == module_detail_id && (result as RowDataPacket).data[i].permissions[j].action == action) {
    //                         return true
    //                     }
    //                 }
    //             }
    //         }
    //         return false
    //     }
    // }


    public checkPermissionUserId = async (user_id: number, url: string, action: string) => {
        const query = `
            select m.id from permission p
            left join module_detail md on md.id = p.module_detail_id
            left join module m on m.id = md.module_id
            where p.role_id = (select role_id from user_role where user_id = ?) and m.url = ? and md.action = ? and p.status = 1
        `
        const result = await database.executeQuery(query, [user_id, url, action]) as RowDataPacket
        if (result.length > 0) {
            return true
        }
        return false
    }

    public findAll = async (role_id: number) => {
        try {
            if (role_id == undefined || role_id == null) {
                return new HttpException(400, errorMessages.INVALID_ROLE_ID);
            }
            let queryModule = `select * from module`;
            let resultModule = await database.executeQuery(queryModule);
            if (Array.isArray(resultModule) && resultModule.length == 0) {
                return {
                    data: []
                }
            }
            let listModule = (resultModule as RowDataPacket);

            for (let i = 0; i < listModule.length; i++) {
                let action: IAction[] = [
                    {
                        name: EAction.CREATE,
                        action: EActionValue.CREATE,
                        status: 0
                    },
                    {
                        name: EAction.UPDATE,
                        action: EActionValue.UPDATE,
                        status: 0
                    },
                    {
                        name: EAction.DELETE,
                        action: EActionValue.DELETE,
                        status: 0
                    },
                    {
                        name: EAction.INDEX,
                        action: EActionValue.INDEX,
                        status: 0
                    },
                    {
                        name: EAction.PUBLISH,
                        action: EActionValue.PUBLISH,
                        status: 0
                    }
                ]
                listModule[i].permissions = action;
                if (listModule[i].id == 3) {
                    listModule[i].permissions = action.slice(0, 4);
                    let publishAction = {
                        name: EAction.STATUS,
                        action: EActionValue.PUBLISH,
                        status: 0
                    }
                    listModule[i].permissions.push(publishAction);
                }

                if (listModule[i].id == 3 || listModule[i].id == 5 || listModule[i].id == 6) {

                    if (listModule[i].id != 3) {
                        let importExcel = {
                            name: EAction.IMPORT,
                            action: EActionValue.IMPORT,
                            status: 0
                        }
                        listModule[i].permissions.push(importExcel);
                    }
                    let exportExcel = {
                        name: EAction.EXPORT,
                        action: EActionValue.EXPORT,
                        status: 0
                    }
                    listModule[i].permissions.push(exportExcel);
                }
                if (listModule[i].id == 3) {
                    let report = {
                        name: EAction.REPORT,
                        action: EActionValue.REPORT,
                        status: 0
                    }
                    listModule[i].permissions.push(report);
                }
                if (listModule[i].id == 22) {
                    listModule[i].permissions = action.slice(4, 4);
                    let updateAction = {
                        name: EAction.UPDATE,
                        action: EActionValue.CREATE,
                        status: 0
                    }

                    let indexAction = {
                        name: EAction.INDEX,
                        action: EActionValue.INDEX,
                        status: 0
                    }
                    listModule[i].permissions.push(updateAction);
                    listModule[i].permissions.push(indexAction);
                }

                // check role_id
                let role = await this.findAllActionByRoleId(role_id);
                if (role instanceof HttpException) {
                    for (let p = 0; p < listModule[i].permissions.length; p++) {
                        listModule[i].permissions[p] = action[p];
                    }
                } else {
                    for (let j = 0; j < (role as RowDataPacket).data.length; j++) {
                        if ((role as RowDataPacket).data[j].module_detail_id == listModule[i].id) {
                            for (let k = 0; k < listModule[i].permissions.length; k++) {
                                if ((role as RowDataPacket).data[j].action == listModule[i].permissions[k].action && (role as RowDataPacket).data[j].status == 1) {
                                    listModule[i].permissions[k].status = 1;
                                }
                            }
                        }
                    }
                }
            }
            return {
                data: listModule
            }
        } catch (error) { }
    }

    // sua 
    public findAllPermissionByRoleIdAndMouleId = async (role_id: number, module_id: number) => {
        let query = `SELECT 
            md.id AS module_detail_id,
            md.name AS name,
            md.action AS action,
            COALESCE(p.status, 0) AS status FROM  module_detail AS md LEFT JOIN  permission AS p ON md.id = p.module_detail_id AND p.role_id = ? WHERE  md.module_id = ? order by md.sort desc`;
        let paramValues = [role_id, module_id];
        const result = await database.executeQuery(query, paramValues);
        if (Array.isArray(result) && result.length == 0) {
            return {
                data: []
            }
        }
        return {
            data: result
        }
    }
    public findAllPermissionByRoleId = async (role_id: number) => {
        let queryModule = `select * from module`;

        let resultModule = await database.executeQuery(queryModule);
        if (Array.isArray(resultModule) && resultModule.length == 0) {
            return {
                data: []
            }
        }
        for (let i = 0; i < (resultModule as RowDataPacket).length; i++) {
            const result = await this.findAllPermissionByRoleIdAndMouleId(role_id, (resultModule as RowDataPacket)[i].id);
            if ((result as RowDataPacket).data.length > 0) {
                (resultModule as RowDataPacket)[i].permissions = (result as RowDataPacket).data;
            } else {
                (resultModule as RowDataPacket)[i].permissions = [];
            }
        }
        return {
            data: resultModule
        }
    }


    public checkPermissionByUserId = async (role_id: number, module_id: number, action: string) => {
        let query = `SELECT p.status FROM permission AS p INNER JOIN module_detail AS md ON p.module_detail_id = md.id WHERE md.action = ? AND md.module_id = ? AND p.role_id = ? LIMIT 1`;
        const paramValues = [action, module_id, role_id];
        const result = await database.executeQuery(query, paramValues);
        if (Array.isArray(result) && result.length == 0) {
            return false;
        }
        else if ((result as RowDataPacket)[0].status == 1) {
            return true;
        } else {
            return false;
        }
    }

    public checkPermissionByUserIdUpdate = async (role_id: number, url: string, action: string) => {
       //console.log("aaaaa", role_id, url, action)
        const query = `
            select m.id from permission p
            left join module_detail md on md.id = p.module_detail_id
            left join module m on m.id = md.module_id
            where p.role_id = ? and m.url = ? and md.action = ? and p.status = 1
        `
        const result = await database.executeQuery(query, [role_id, url, action]) as RowDataPacket
        if (result.length > 0) {
            return true
        }
        return false
    }
}

export default PermissionService;