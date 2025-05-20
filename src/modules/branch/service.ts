import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar } from "@core/utils/gennerate.code";

class BranchService {

    private tableName = 'branch';
    public create = async (model: CreateDto) => {
        const existName = await database.executeQuery(`SELECT id from ${this.tableName} where name = ? and seller_id = ?`, [model.name, model.seller_id]) as RowDataPacket
        if (existName.length > 0)
            return new HttpException(400, errorMessages.EXISTED, 'name');
        let code = model.code
        if (code && code.length > 0) {
            if (await checkExist(this.tableName, 'code', code))
                return new HttpException(400, errorMessages.EXISTED, 'code');
        } else {
            code = await generateCodePrefixChar(this.tableName, 'BN', 8)
        }
        const created_at = new Date()
        const updated_at = new Date()
        const exist = await checkExist(this.tableName, 'seller_id', model.seller_id || 0)
        let result;
        if (exist === false) {
            result = await database.executeQuery(`insert into ${this.tableName} (name, publish, created_id, created_at, updated_at, code, seller_id, warehouse_type, city_id, district_id, ward_id, address, is_default, online_selling, longitude, latitude) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [model.name, model.publish ?? 1, model.created_id, created_at, updated_at, code, model.seller_id, model.warehouse_type || null, model.city_id || null, model.district_id || null, model.ward_id || null, model.address || null, 1, 1, model.longitude || null, model.latitude || null]);
        }
        else {  
            result = await database.executeQuery(`insert into ${this.tableName} (name, publish, created_id, created_at, updated_at, code, seller_id, warehouse_type, city_id, district_id, ward_id, address, longitude, latitude) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [model.name, model.publish ?? 1, model.created_id, created_at, updated_at, code, model.seller_id, model.warehouse_type || null, model.city_id || null, model.district_id || null, model.ward_id || null, model.address || null, model.longitude || null, model.latitude || null]);
        }
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED)
        return {
            data: {
                id: (result as any).insertId,
                name: model.name,
                publish: model.publish,
                code: code,
            }
        }
    }
    public update = async (model: CreateDto, id: number) => {
        if (!await checkExist(this.tableName, 'id', id.toString()))
            return new HttpException(404, errorMessages.GROUP_NOT_EXISTED, 'id');
        const exist = await database.executeQuery(
            `SELECT id as idx from ${this.tableName} where name = ? and seller_id = ?`,
            [model.name, model.seller_id]
        ) as RowDataPacket
        if (exist.length > 0 && exist[0].idx != id) {
            return new HttpException(400, errorMessages.GROUP_NAME_EXISTED, 'name');
        }
        // if (await checkExist(this.tableName, 'name', model.name, id.toString()))
        //     return new HttpException(400, errorMessages.GROUP_NAME_EXISTED, 'name');
        const updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let query = `update ${this.tableName} set `;
        let params = [];
        if (model.name != undefined) {
            query += `name = ?, `;
            params.push(model.name);
        }
        if (model.publish != undefined) {
            query += `publish = ?, `;
            params.push(model.publish);
        }
        if (model.is_default != undefined) {
            query += `is_default = ?, `;
            params.push(model.is_default);
        }
        if(model.seller_id != undefined){
            query += `seller_id = ?, `;
            params.push(model.seller_id);
        }
        if(model.warehouse_type != undefined){
            query += `warehouse_type = ?, `;
            params.push(model.warehouse_type);
        }
        if(model.city_id != undefined){
            query += `city_id = ?, `;
            params.push(model.city_id);
        }
        if(model.district_id != undefined){
            query += `district_id = ?, `;
            params.push(model.district_id);
        }
        if(model.ward_id != undefined){
            query += `ward_id = ?, `;
            params.push(model.ward_id);
        }
        if(model.address != undefined){
            query += `address = ?, `;
            params.push(model.address);
        }
        if(model.longitude != undefined){
            query += `longitude = ?, `;
            params.push(model.longitude);
        }
        if(model.latitude != undefined){
            query += `latitude = ?, `;
            params.push(model.latitude);
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
                name: model.name,
                publish: model.publish,
                updated_at: updated_at
            }
        }
    }
    public delete = async (id: number) => {
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(404, errorMessages.GROUP_NOT_EXISTED, 'id');
        if ((check as RowDataPacket)[0].is_default == 1)
            return new HttpException(400, errorMessages.CANNOT_DELETE_DATA_DEFAULT, 'id');
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
        const result = await database.executeQuery(`
            select b.*, c.name as city_name, d.name as district_name, w.name as ward_name, s.phone as seller_phone, s.name as seller_name, s.email as sender_email from branch b 
            left join city c on c.id = b.city_id
            left join district d on d.id = b.district_id
            left join ward w on w.id = b.ward_id
            left join seller s on s.id = b.seller_id
            where b.id = ?
        `, [id]) as RowDataPacket
        if (result.length === 0)
            return new HttpException(404, errorMessages.GROUP_NOT_EXISTED, 'id');
        return {
            data: (result as any)[0]
        }
    }
    public searchs = async (key: string, name: string, publish: boolean, page: number, limit: number, seller_id: number) => {
       //console.log(seller_id)
        let query = `
            select b.id, b.code, b.name, b.created_at, b.publish, b.address, c.name as city_name, d.name as district_name, w.name as ward_name from ${this.tableName} b 
            left join city c on b.city_id = c.id
            left join district d on b.district_id = d.id
            left join ward w on b.ward_id = w.id
            where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} b WHERE 1=1`;

        if (key != undefined) {
            query += ` and b.name like '%${key}%'`
            countQuery += ` and b.name like '%${key}%'`
        }
        if (name != undefined) {
            query += ` and b.name like '%${name}%'`
            countQuery += ` and b.name like '%${name}%'`
        }
        if (publish != undefined) {
            query += ` and b.publish = ${publish}`
            countQuery += ` and b.publish = ${publish}`
        }
        if(seller_id != undefined){
            query += ` and b.seller_id = ${seller_id}`
            countQuery += ` and b.seller_id = ${seller_id}`
        }
        query += ` order by b.id desc`
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
    public updatePublish = async (id: number) => {
        try {
            let result = null;
            let publish = 0
            const updated_at = new Date()
            const getPublish = await database.executeQuery(`select publish from ${this.tableName} where id = ?`, [id]);
            if ((getPublish as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND, 'id');
            if ((getPublish as RowDataPacket[])[0].publish == 0) {
                publish = 1
                result = await database.executeQuery(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publish, updated_at, id]);
            }
            if ((getPublish as RowDataPacket[])[0].publish == 1) {
                result = await database.executeQuery(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publish, updated_at, id]);
            }
            return {
                data: {
                    id: id,
                    publish: publish,
                    updated_at: updated_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public deleteRows = async (data: number[]) => {
        let query = `delete from ${this.tableName} where id in (${data}) and is_default = 0`
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
    public deleteBySellerId = async (seller_id: number) => {
        if (!await checkExist(this.tableName, 'seller_id' , seller_id.toString()))
            return new HttpException(400, errorMessages.NOT_EXISTED);
        const result = await database.executeQuery(`delete from ${this.tableName} where seller_id = ?`, [seller_id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS,
            seller_id: seller_id
        }
    }
}

export default BranchService