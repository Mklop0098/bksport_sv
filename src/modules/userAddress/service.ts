import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";

class UserAddressService {
    private tableName = 'user_address';
    private fieldId = 'id'

    public create = async (model: CreateDto) => {
        try {
            let query = `insert into ${this.tableName} (name, phone, city_id, district_id, ward_id, address, created_id, customer_id, is_default, seller_id) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                model.name || null,
                model.phone || null,
                model.city_id || null,
                model.district_id || null,
                model.ward_id || null,
                model.address || null,
                model.created_id || null,
                model.customer_id || null,
                model.is_default ?? 0,
                model.seller_id || 0
            ]
            const created_at = new Date()
            const update_at = new Date()
            const result = await database.executeQuery(query, values);
            if ((result as any).affectedRows === 0)
                return new HttpException(400, errorMessages.CREATE_FAILED);
            if (model.is_default && model.is_default.toString().length > 0) {
                await this.updateDefaultAddress((result as any).insertId);
            }
            return {
                data: {
                    id: (result as any).insertId,
                    ...model,
                    publish: model.publish ?? 1,
                    created_at: created_at,
                    updated_at: update_at
                }
            }
        } catch (error) {
            return new HttpException(500, errorMessages.CREATE_FAILED);
        }
    }
    public update = async (model: CreateDto, id: number) => {
        if (!await checkExist(this.tableName, this.fieldId, id.toString()))
            return new HttpException(400, errorMessages.EXISTED, this.fieldId);
        const update_at = new Date()
        let query = ` update ${this.tableName} set `;
        let values = [];
        if (model.name) {
            query += ` name = ?,`
            values.push(model.name)
        }
        if (model.phone != undefined) {
            query += ` phone = ?,`
            values.push(model.phone)
        }
        if (model.city_id) {
            query += ` city_id = ?,`
            values.push(model.city_id)
        }
        if (model.district_id) {
            query += ` district_id = ?,`
            values.push(model.district_id)
        }
        if (model.ward_id) {
            query += ` ward_id = ?,`
            values.push(model.ward_id)
        }
        if (model.address) {
            query += ` address = ?,`
            values.push(model.address)
        }
        if (model.customer_id) {
            query += ` customer_id = ?,`
            values.push(model.customer_id)
        }
        if(model.seller_id != undefined) {
            query += ` seller_id = ?,`
            values.push(model.seller_id)
        }
        if (model.is_default != undefined) {
            const checkQuantityAddress = await database.executeQuery(`select count(*) as total from ${this.tableName} where customer_id = ?`, [model.customer_id]);
            if ((checkQuantityAddress as RowDataPacket[])[0].total == 1 && model.is_default == 0) {
                return new HttpException(400, errorMessages.ADDRESS_DEFAULT_REQUIRED, 'is_default');
            }
        }
        query += ` updated_at = ? where id = ?`
        values.push(update_at)
        values.push(id)
        const result = await database.executeQuery(query, values);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        if (model.is_default && model.is_default.toString().length > 0) {
            await this.updateDefaultAddress(id);
        }
        let checkCity = null;
        let checkDistrict = null;
        let checkWard = null
        try {
            checkCity = await database.executeQuery(`select * from city where id = ?`, [model.city_id]);
            checkDistrict = await database.executeQuery(`select * from district where id = ?`, [model.district_id]);
            checkWard = await database.executeQuery(`select * from ward where id = ?`, [model.ward_id]);
        } catch (error) {}
        return {
            data: {
                id: id,
                publish: model.publish,
                updated_at: update_at,
                ...model,
                city_name: (checkCity as RowDataPacket[]) ? (checkCity as RowDataPacket[])[0].name : null,
                district_name: (checkDistrict as RowDataPacket[]) ? (checkDistrict as RowDataPacket[])[0].name : null,
                ward_name: (checkWard as RowDataPacket[]) ? (checkWard as RowDataPacket[])[0].name : null
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
    public searchs = async (key: string, name: string, publish: boolean, page: number, limit: number, seller_id: number ) => {
        let query = `select * from ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;

        if (key && key.length != 0) {
            query += ` and name like '%${key}%'`
            countQuery += ` and name like '%${key}%'`
        }
        if (name && name.length != 0) {
            query += ` and name like '%${name}%'`
            countQuery += ` and name like '%${name}%'`
        }
        if(seller_id != undefined) {
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
    public findAddressesByCustomerId = async (customer_id: number) => {
        let query = `select ua.* , ct.name as city_name , dt.name as district_name,  wd.name as ward_name  from ${this.tableName} ua  left join city ct on ua.city_id = ct.id left join district dt on  dt.id = ua.district_id left join ward wd on wd.id = ua.ward_id where customer_id = ?`
        const result = await database.executeQuery(query, [customer_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result
        }
    }
    public updateDefaultAddress = async (id: number) => {
        try {
            const update_at = new Date()
            let check = await database.executeQuery(`select * from ${this.tableName} where id = ?`, [id]);
            if ((check as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND);
            let customer_id: number = (check as RowDataPacket[])[0].customer_id
            if (customer_id)
                await database.executeQuery(`update ${this.tableName} set is_default = 0, updated_at = ? where customer_id = ?`, [update_at, customer_id]);
            let query = `update ${this.tableName} set is_default = 1, updated_at = ? where id = ?`
            const result = await database.executeQuery(query, [update_at, id]);
            if ((result as any).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            // await database.executeQuery(`update customers set address = ?, city_id = ?, district_id = ?, ward_id = ? where id = ?`, [(check as RowDataPacket[])[0].address, (check as RowDataPacket[])[0].city_id, (check as RowDataPacket[])[0].district_id, (check as RowDataPacket[])[0].ward_id, customer_id]);
            return {
                data: {
                    id: id,
                    is_defaul: 1,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public findDefaultAddressByCustomerId = async (id: number) => {
        let query = `select * from ${this.tableName} where customer_id = ? and is_default = 1`
        const result = await database.executeQuery(query, [id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result
        }
    }
}

export default UserAddressService;