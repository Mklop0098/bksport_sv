import { HttpException } from "@core/exceptions";
import database from "@core/config/database";
import { RowDataPacket } from "mysql2/promise";
import mysql from "mysql2/promise";
import { IPagiantion } from "@core/interfaces";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import { Create as CreateDto } from "@modules/shipers/dtos/create.dto";
import { generateCodeWithSeller } from "@core/utils/gennerate.code";
import { getOrderByShipperId } from "./ultils";
class ShipersService {
    private tableName = 'shipers';
    public getAll = async (key: string, pageInt: number, limitInt: number, active: number, type: string, seller_id: number, branch_id: number) => {
        let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
        let countQuery = `SELECT COUNT(*) AS total FROM ${this.tableName} WHERE 1=1`;

        if (key && key.length != 0) {
            query += ` AND (name LIKE '%${key}%' OR phone LIKE '%${key}%' OR email LIKE '%${key}%')`
            countQuery += ` AND (name LIKE '%${key}%' OR phone LIKE '%${key}%' OR email LIKE '%${key}%')`
        }
        if (active && active.toString().length > 0) {
            query += ` AND active = ${active}`
            countQuery += ` AND active = ${active}`
        }
        if (type && type.length != 0) {
            query += ` AND type = '${type}'`
            countQuery += ` AND type = '${type}'`
        }
        if (seller_id && seller_id.toString().length > 0) {
            query += ` AND seller_id = ${seller_id}`
            countQuery += ` AND seller_id = ${seller_id}`
        }
        if (branch_id != undefined) {
            query += ` AND branch_id = ${branch_id}`
            countQuery += ` AND branch_id = ${branch_id}`
        }
        query += ` ORDER BY id DESC`
        if (pageInt && pageInt < 1 || pageInt && limitInt < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (pageInt && limitInt) {
            query = query + ` LIMIT ` + limitInt + ` OFFSET ` + (pageInt - 1) * limitInt;
        }

        let pagination: IPagiantion = {
            page: pageInt,
            limit: limitInt,
            totalPage: 0
        }
        const count = await database.executeQuery(countQuery);
        const totalPages = Math.ceil((count as RowDataPacket[])[0].total / limitInt);
        if (Array.isArray(count) && count.length > 0)
            pagination.totalPage = totalPages

        const result = await database.executeQuery(query);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.FIND_ALL_FAILED);
        
        return {
            data: result,
            pagination: pagination
        }
    }
    public create = async (model: CreateDto) => {
        let code = await generateCodeWithSeller(this.tableName, 'S', 8, model.seller_id as number) as string;
        
        const checkPhone = await checkExist(this.tableName, 'phone', model.phone);
        if (model.name != undefined) {
            const checkName = await checkExist(this.tableName, 'name', model.name);
            if (checkName)
                return new HttpException(400, errorMessages.NAME_EXISTED, 'name');
        }
        if (checkPhone)
            return new HttpException(400, errorMessages.PHONE_EXISTED, 'phone');
        try {
            const created_at = new Date()
            const updated_at = new Date()
            let query = `INSERT INTO ${this.tableName} ( code, name, email, phone, address, note, active, type, seller_id, branch_id, created_id, created_at , updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                code,
                model.name,
                model.email,
                model.phone,
                model.address,
                model.note || "",
                model.active || 1,
                model.type,
                model.seller_id,
                model.branch_id,
                model.created_id,
                created_at,
                updated_at,
            ]
            const result = await database.executeQuery(query, values);
            let id = (result as mysql.ResultSetHeader).insertId;
            model.code = code;

            return {
                data: {
                    id: id,
                    ...model,
                    created_at: created_at,
                    updated_at: updated_at,
                }
            }
        } catch (error) {
            return new HttpException(500, errorMessages.CREATE_FAILED);
        }
    }
    public update = async (model: CreateDto, id: number) => {
        if (!await checkExist(this.tableName, 'id', id.toString()))
            return new HttpException(400, errorMessages.EXISTED, 'id');
        if (await checkExist(this.tableName, 'name', model.name, id.toString()))
            return new HttpException(400, errorMessages.NAME_EXIST, 'name');
        if (await checkExist(this.tableName, 'phone', model.phone, id.toString()))
            return new HttpException(400, errorMessages.PHONE_EXISTED, 'phone');
        const update_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const result = await database.executeQuery(`UPDATE ${this.tableName} SET name = ?, email = ?, phone = ?, address = ?, note = ?, active = ?, updated_at = ? WHERE id = ?`, [model.name, model.email, model.phone, model.address, model.note || "", model.active, update_at, id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        return {
            data: {
                id: id,
                name: model.name,
                email: model.email,
                phone: model.phone,
                address: model.address,
                note: model.note,
                active: model.active,
                updated_at: new Date()
            }
        }
    }
    public updateActive = async (id: number) => {
        try {
            let active = 0
            const update_at = new Date()
            const getactive = await database.executeQuery(`SELECT active FROM ${this.tableName} WHERE id = ?`, [id]);
            if ((getactive as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND);
            if ((getactive as RowDataPacket[])[0].active == 0) {
                active = 1
            }
            let result = await database.executeQuery(`UPDATE ${this.tableName} SET active = ?, updated_at = ? WHERE id = ?`, [active, update_at, id]);
            if ((result as any).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            
            return {
                data: {
                    id: id,
                    active: active,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public delete = async (id: number) => {
        const checkId = await checkExist(this.tableName, 'id', id.toString());
        if (!checkId)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        const result = await database.executeQuery(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            data: {
                message: errorMessages.DELETE_SUCCESS,
                id: id
            }
        }
    }
    public getOne = async (id: number) => {
        const data = await getOrderByShipperId(id)
        console.log(data)
        const query = `
            SELECT s.*
            FROM ${this.tableName} s 
            LEFT JOIN order_delivery_method odm ON odm.shipper_id = s.id
            WHERE s.id = ?
        `
        const result = await database.executeQuery(query, [id]) as RowDataPacket;
        if (result.length < 1)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        return {
            data: {
                ...(result as RowDataPacket[])[0],
                ship_history: data.data.list_order || [],
                total_ship_fee: data.data.total_ship_fee || 0,
                total_order: data.data.total_order || 0
            }
        };


    }
    
    public deleteMultiple = async (data: number[]) => {
        let query = `DELETE FROM ${this.tableName} WHERE id IN (${data})`
        const result = await database.executeQuery(query);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS
        }
    }
    public updateListActive = async (data: number[], active: number) => {
        try {
            let result = null;
            const update_at = new Date()
            let query = `UPDATE ${this.tableName} SET active = ?, updated_at = ? WHERE id IN (${data})`
            result = await database.executeQuery(query, [active, update_at]);
            return {
                data: {
                    active: active,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }

    public search = async (key: string) => {
        const query = `SELECT * FROM ${this.tableName} WHERE name LIKE '%${key}%' OR phone LIKE '%${key}%' OR email LIKE '%${key}%'`
        const result = await database.executeQuery(query)
        return result
    }
}

export default ShipersService;