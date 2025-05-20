import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { addCollate } from "@core/utils/addCollate";

class CityService {
    private tableName = 'district';
    private fieldId = 'id'
    private fieldName = 'name'

    public create = async (model: CreateDto) => {
        let publish = model.publish ?? 1
        // if (await checkExist(this.tableName, this.fieldName, model.name))
        //     return new HttpException(400, errorMessages.EXISTED, this.fieldName);
        const created_at = new Date()
        const updated_at = new Date()
        const result = await database.executeQuery(`insert into ${this.tableName} (name, publish, created_at, updated_at, city_id) values (?, ?, ?, ?, ?)`, [model.name, publish, created_at, updated_at, model.city_id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED)
        return {
            data: {
                id: (result as any).insertId,
                ...model,
                publish,
            }
        }
    }
    public update = async (model: CreateDto, id: number) => {
        if (!await checkExist(this.tableName, this.fieldId, id.toString()))
            return new HttpException(400, errorMessages.EXISTED, this.fieldId);
        if (await checkExist(this.tableName, this.fieldName, model.name, id.toString()))
            return new HttpException(400, errorMessages.NAME_EXIST, this.fieldName);
        const update_at = new Date()
        const result = await database.executeQuery(`update ${this.tableName} set name = ?, publish = ?, updated_at = ?, city_id = ? where id = ?`, [model.name, model.publish, update_at, model.city_id, id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        return {
            data: {
                id: id,
                name: model.name,
                publish: model.publish,
                updated_at: new Date()
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
            return new HttpException(400, errorMessages.EXISTED);
        return {
            data: (result as any)[0]
        }
    }
    public searchs = async (key: string, name: string, publish: boolean, page: number, limit: number, city_id: number) => {
        let query = `select ${this.tableName}.*, (select count(ward.id) from ward where ward.${this.tableName}_id = ${this.tableName}.id) as totalWard from ${this.tableName} ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;

        if (key && key.length != 0) {
            query += ` and name like '%${key}%'`
            countQuery += ` and name like '%${key}%'`
        }
        if (name && name.length != 0) {
            query += ` and name like '%${name}%'`
            countQuery += ` and name like '%${name}%'`
        }
        if (publish) {
            query += ` and publish = ${publish}`
            countQuery += ` and publish = ${publish}`
        }
        if (city_id) {
            query += ` and city_id = ${city_id}`
            countQuery += ` and city_id = ${city_id}`
        }
        query += ` order by name asc`
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
        const result = await database.executeQuery(await addCollate(query));
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
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
                return new HttpException(404, errorMessages.NOT_FOUND);
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
            message: errorMessages.DELETE_SUCCESS
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
}

export default CityService;