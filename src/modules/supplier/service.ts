import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import { checkExist, checkSellerEntityExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import mysql from "mysql2/promise";
import Ilog from "@core/interfaces/log.interface";

class SupplierService {
    private tableName = 'supplier';
    private moduleId = 2;

    public create = async (model: CreateDto) => {
        try {
            if (model.seller_id) {
                if (await checkSellerEntityExist(this.tableName, 'phone', model.phone ?? '', model.seller_id))
                    return new HttpException(400, errorMessages.PHONE_EXISTED, 'phone');
                if (model.email && await checkSellerEntityExist(this.tableName, 'email', model.email, model.seller_id))
                    return new HttpException(400, errorMessages.EMAIL_EXISTED, 'email');
                if (await checkSellerEntityExist(this.tableName, 'name', model.name ?? '', model.seller_id))
                    return new HttpException(400, errorMessages.NAME_EXISTED, 'name');
            }
            else {
                return new HttpException(400, errorMessages.SELLER_NOT_FOUND, 'seller_id');
            }
            const created_at = new Date()
            const updated_at = new Date();
            const log: Ilog = {
                action: errorMessages.CREATE,
                user_id: model.created_id!,
                module_id: this.moduleId,
            }
            const result = await database.executeQueryLog(
                `INSERT INTO ${this.tableName} (phone, name, email, group_id, address, status, created_at, updated_at, created_id, city_id, district_id, ward_id, seller_id) VALUES ( ? , ? , ? , ? , ? , ? , ? , ? , ?, ?, ?, ?, ?)`,
                [model.phone,
                model.name ,
                model.email || null,
                model.group_id as number,
                model.address,
                    1,
                    created_at,
                    updated_at,
                model.created_id || null,
                model.city_id || null,
                model.district_id || null,
                model.ward_id || null,
                model.seller_id || 0
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
        let log: Ilog = {
            action: errorMessages.DELETE,
            user_id: model.created_id!,
            module_id: this.moduleId,
            des: (checkId as any)[0].name
        }
        const result = await database.executeQueryLog(`delete from ${this.tableName} where id = ?`, [id], log);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: id
        }
    }
    public updateProfile = async (model: CreateDto, id: number) => {
        //console.log(model);
        if (model.seller_id) {
            if (await checkSellerEntityExist(this.tableName, 'phone', model.phone ?? '', model.seller_id))
                return new HttpException(400, errorMessages.PHONE_EXISTED, 'phone');
            if (await checkSellerEntityExist(this.tableName, 'email', model.email ?? '', model.seller_id))
                return new HttpException(400, errorMessages.EMAIL_EXISTED, 'email');
            if (await checkSellerEntityExist(this.tableName, 'name', model.name ?? '', model.seller_id))
                return new HttpException(400, errorMessages.NAME_EXISTED, 'name');
        }
        else {
            return new HttpException(400, errorMessages.SELLER_NOT_FOUND, 'seller_id');
        }

        let result = null;
        const checkId = await checkExist(this.tableName, 'id', id.toString());
        if (checkId == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        const code = (checkId as any)[0].code;
        const updated_at = new Date()
        let query = `update ${this.tableName} set `;
        let values = [];
        if (model.phone) {
            query += `phone = ?, `;
            values.push(model.phone);
        }
        if (model.name) {
            query += `name = ?, `;
            values.push(model.name);
        }
        if (model.email) {
            query += `email = ?, `;
            values.push(model.email);
        }
        if (model.group_id) {
            query += `group_id = ?, `;
            values.push(model.group_id as number);
        }
        if (model.address) {
            query += `address = ?, `;
            values.push(model.address);
        }
        if (model.status !== undefined) {
            query += `status = ?, `;
            values.push(model.status);
        }
        if (model.city_id) {
            query += `city_id = ?, `;
            values.push(model.city_id);
        }
        if (model.district_id) {
            query += `district_id = ?, `;
            values.push(model.district_id);
        }
        if (model.ward_id) {
            query += `ward_id = ?, `;
            values.push(model.ward_id);
        }
        if(model.seller_id !== undefined){
            query += `seller_id = ?, `;
            values.push(model.seller_id);
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
        let query = `select s.*, g.name as group_name, ct.name as city_name, dt.name as district_name, w.name as ward_name from ${this.tableName} s left join \`supplier-group\` g on s.group_id = g.id left join city ct on s.city_id = ct.id  left join district dt on dt.id = s.district_id left join ward w on s.ward_id = w.id where s.id = ?`
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
    public searchs = async (key: string, name: string, phone: string, email: string, group_id: number, status: boolean, page: number, limit: number, seller_id: number) => {
        let query = `select s.*, g.name as group_name, ct.name as city_name, dt.name as district_name, w.name as ward_name from ${this.tableName} s left join \`supplier-group\` g on s.group_id = g.id left join city ct on s.city_id = ct.id left join district dt on s.district_id = dt.id left join ward w on s.ward_id = w.id where 1=1`;
        let countQuery = `SELECT COUNT(*) AS total 
                          FROM ${this.tableName} s 
                          LEFT JOIN \`supplier-group\` g ON s.group_id = g.id 
                          WHERE 1=1`;

        if (key && key.length !== 0) {
            query += ` AND (s.name LIKE '%${key}%' OR s.phone LIKE '%${key}%' OR s.email LIKE '%${key}%')`;
            countQuery += ` AND (s.name LIKE '%${key}%' OR s.phone LIKE '%${key}%' OR s.email LIKE '%${key}%')`;
        }
        if (name && name.length !== 0) {
            query += ` AND s.name LIKE '%${name}%'`;
            countQuery += ` AND s.name LIKE '%${name}%'`;
        }
        if (phone && phone.length !== 0) {
            query += ` AND s.phone LIKE '%${phone}%'`;
            countQuery += ` AND s.phone LIKE '%${phone}%'`;
        }
        if (email && email.length !== 0) {
            query += ` AND s.email LIKE '%${email}%'`;
            countQuery += ` AND s.email LIKE '%${email}%'`;
        }
        if (group_id) {
            query += ` AND s.group_id = ${group_id}`;
            countQuery += ` AND s.group_id = ${group_id}`;
        }
        if (status) {
            query += ` AND s.status = ${status}`;
            countQuery += ` AND s.status = ${status}`;
        }
        if(seller_id != undefined){
            query += ` AND s.seller_id = ${seller_id}`;
            countQuery += ` AND s.seller_id = ${seller_id}`;
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
export default SupplierService;