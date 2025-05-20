import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { generateCode, generateCodeWithPrefix, generateCodeWithSeller } from "@core/utils/gennerate.code";
import { HttpException } from "@core/exceptions";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import { checkExist, checkSellerEntityExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import mysql from "mysql2/promise";
import * as xlsx from 'xlsx';
import { IError } from "@core/interfaces";
import { formatDate } from "@core/utils/formatDate";
import UserAddressService from "@modules/userAddress/service";
import { CreateDto as Address } from "@modules/userAddress";
import { addCollate } from "@core/utils/addCollate";
import Ilog from "@core/interfaces/log.interface";
import { stringify } from "querystring";

class CustomerSerivces {
    private tableName = 'customers';
    private tableCity = 'city';
    private tableDistrict = 'district';
    private tableWard = 'ward';
    private moduleId = 6;

    private userAddressService = new UserAddressService();

    public create = async (model: CreateDto) => {
        let sellerCodeQuery = `SELECT code from seller WHERE id = ?`
        const sellerCode = await database.executeQuery(sellerCodeQuery, [model.seller_id]) as RowDataPacket
        let code = sellerCode[0].code + model.code;
        try {
            if (model.seller_id) {
                if (await checkSellerEntityExist(this.tableName, 'phone', model.phone ?? '', model.seller_id))
                    return new HttpException(400, errorMessages.PHONE_EXISTED, 'phone');
                if (await checkSellerEntityExist(this.tableName, 'email', model.email ?? '', model.seller_id))
                    return new HttpException(400, errorMessages.EMAIL_EXISTED, 'email');
                if (model.code && model.code.length > 0) {
                    if (await checkExist(this.tableName, 'code', code))
                        return new HttpException(400, errorMessages.CODE_EXISTED, 'code');
                    // } else code = await generateCodeWithPrefix('customers', 'KH', 8);
                } else code = await generateCodeWithSeller('customers', 'KH', 8, model.seller_id as number) as string
            }
            else {
                return new HttpException(400, errorMessages.SELLER_NOT_FOUND, 'seller_id');
            }
            if (model.type == 0 || '' as any) {
                model.type = 0;
                model.tax_code = '';
            }
            if (model.type == 1) {
                if (model.tax_code == '' || !model.tax_code)
                    return new HttpException(400, errorMessages.TAX_CODE_NOT_EXISTED);
                const checkTaxCode = await database.executeQuery(`SELECT * FROM ${this.tableName} WHERE tax_code = ?`, [model.tax_code]);
                if (Array.isArray(checkTaxCode) && checkTaxCode.length > 0)
                    return new HttpException(400, errorMessages.TAX_CODE_EXISTED, 'tax_code');
            }
            if (model.birthdate) {
                let birthdate = formatDate(new Date(model.birthdate));
                model.birthdate = birthdate as unknown as Date;
            }
            const created_at = new Date()
            const updated_at = new Date()
            //console.log(code)
            let query = `INSERT INTO ${this.tableName} (code, phone, name, email, type, group_id, publish, birthdate, gender, tax_code, created_id, created_at, updated_at, city_id, district_id, ward_id, address, manager_id, longitude, latitude, seller_id) VALUES (?, ?, ?, ? , ? , ? , ? , ?, ?, ?, ?, ?, ?, ?, ? , ? , ?, ?, ?, ?, ?)`;
            const values = [
                code,
                model.phone ?? null,
                model.name ?? null,
                model.email ?? null,
                model.type ?? 0,
                model.group_id as number ?? null,
                1,
                model.birthdate ?? null,
                model.gender ?? 2,
                model.tax_code ?? null,
                model.created_id ?? null,
                created_at,
                updated_at,
                model.city_id ?? null,
                model.district_id ?? null,
                model.ward_id ?? null,
                model.address ?? null,
                model.created_id ?? null,
                model.longitude ?? 0,
                model.latitude ?? 0,
                model.seller_id ?? 0
            ]
            const log: Ilog = {
                action: errorMessages.CREATE,
                user_id: model.created_id!,
                module_id: this.moduleId,
            }
            const result = await database.executeQueryLog(query, values, log);
            //console.log("result", result);

            if ((result as RowDataPacket).affectedRows === 0)
                return new HttpException(400, errorMessages.CREATE_FAILED);
            const city = await database.executeQuery(`SELECT * FROM ${this.tableCity} WHERE id = ?`, [model.city_id]);
            const district = await database.executeQuery(`SELECT * FROM ${this.tableDistrict} WHERE id = ?`, [model.district_id]);
            const ward = await database.executeQuery(`SELECT * FROM ${this.tableWard} WHERE id = ?`, [model.ward_id]);
            // if (model.phone && !/^(0|\+84)([0-9]{9})$/.test(model.phone)){
            //     return new HttpException(400, errorMessages.PHONE_NOT_VALID, 'phone');
            // }
            const customerAddress: Address = {
                customer_id: (result as RowDataPacket).insertId,
                name: model.name,
                phone: model.phone,
                address: model.address,
                city_id: model.city_id,
                district_id: model.district_id,
                ward_id: model.ward_id,
                city_name: (city as RowDataPacket)[0].name,
                district_name: (district as RowDataPacket)[0].name,
                ward_name: (ward as RowDataPacket)[0].name,
                is_default: model.is_default || 0,
                created_id: model.created_id,
            }
            const resultAddress = await this.userAddressService.create(customerAddress);
            if ((resultAddress as any).affectedRows === 0)
                return new HttpException(400, errorMessages.CREATE_FAILED);
            let data = {
                id: (result as any).insertId,
                ...model,
                code: code,
                created_at: created_at,
                updated_at: updated_at,
                customer_address: (resultAddress as RowDataPacket).data,
            }
            return {
                data: data
            };
        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED);
        }
    }
    public delete = async (id: number) => {
        const checkId = await checkExist(this.tableName, 'id', id.toString());
        if (checkId == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        const code = (checkId as any)[0].code;
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
    public updateProfile = async (model: CreateDto, id: number) => {
        let result = null
        const checkId = await checkExist(this.tableName, 'id', id.toString());
        if (checkId == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        if (model.seller_id) {
            const checkPhone = await checkSellerEntityExist(this.tableName, 'phone', model.phone ?? '', model.seller_id)
            //console.log(checkPhone[0].id, id)
            if (checkPhone && checkPhone.length > 0 && checkPhone[0].id != id)
                return new HttpException(400, errorMessages.PHONE_EXISTED, 'phone');
            const checkEmail = await checkSellerEntityExist(this.tableName, 'email', model.email ?? '', model.seller_id)
            if (checkEmail && checkEmail.length > 0 && checkPhone[0].id != id)
                return new HttpException(400, errorMessages.EMAIL_EXISTED, 'email');
        }
        else {
            return new HttpException(400, errorMessages.SELLER_NOT_FOUND, 'seller_id');
        }
        // if(model.code != undefined){
        //     if (await checkExist(this.tableName, 'code', model.code, id.toString()))
        //         return new HttpException(400, errorMessages.CODE_EXISTED, 'code');
        // }
        // if (model.type == 0 || '' as any) {
        //     model.type = 0;
        //     model.tax_code = '';
        //     model.gender = 0
        // }
        // if (model.type == 1) {
        //     if (model.tax_code == undefined)
        //         return new HttpException(400, errorMessages.TAX_CODE_NOT_EXISTED, 'tax_code');
        //     if (await checkExist(this.tableName, 'tax_code', model.tax_code, id.toString()))
        //         return new HttpException(400, errorMessages.TAX_CODE_EXISTED, 'tax_code');
        // }
        const updated_at = new Date()
        try {
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
            if (model.group_id !== undefined) {
                query += `group_id = ?, `;
                values.push(model.group_id);
            }
            if (model.address) {
                query += `address = ?, `;
                values.push(model.address);
            }
            if (model.birthdate) {
                query += `birthdate = ?, `;
                let birthdate = formatDate(new Date(model.birthdate));
                model.birthdate = birthdate as unknown as Date;
                values.push(birthdate);
            }
            if (model.gender !== undefined) {
                query += `gender = ?, `;
                values.push(model.gender)
            }
            if (model.tax_code) {
                query += `tax_code = ?, `;
                values.push(model.tax_code);
            }
            if (model.publish !== undefined) {
                query += `publish = ?, `;
                values.push(model.publish);
            }
            if (model.city_id !== undefined) {
                query += `city_id = ?, `;
                values.push(model.city_id);
                const city = await database.executeQuery(`SELECT * FROM ${this.tableCity} WHERE id = ?`, [model.city_id]);
                if ((city as RowDataPacket).length !== 0) {
                    model.city_name = (city as RowDataPacket)[0].name;
                }
            }
            if (model.district_id !== undefined) {
                query += `district_id = ?, `;
                values.push(model.district_id);
                const district = await database.executeQuery(`SELECT * FROM ${this.tableDistrict} WHERE id = ?`, [model.district_id]);
                if ((district as RowDataPacket).length !== 0) {
                    model.district_name = (district as RowDataPacket)[0].name;
                }
            }
            if (model.ward_id !== undefined) {
                query += `ward_id = ?, `;
                values.push(model.ward_id);
                const ward = await database.executeQuery(`SELECT * FROM ${this.tableWard} WHERE id = ?`, [model.ward_id]);
                if ((ward as RowDataPacket).length !== 0) {
                    model.ward_name = (ward as RowDataPacket)[0].name;
                }
            }
            if (model.type != undefined) {
                query += `type = ?, `;
                values.push(model.type);
            }

            if (model.longitude != undefined) {
                query += `longitude = ?, `;
                values.push(model.longitude);
            }
            if (model.latitude != undefined) {
                query += `latitude = ?, `;
                values.push(model.latitude);
            }
            if (model.seller_id != undefined) {
                query += `seller_id = ?, `;
                values.push(model.seller_id);
            }
            query += `updated_at = ? where id = ?`;
            values.push(updated_at);
            values.push(id);
            const log: Ilog = {
                action: errorMessages.UPDATE,
                user_id: model.created_id!,
                module_id: this.moduleId,
            }
            const result = await database.executeQueryLog(query, values, log);
            if ((result as mysql.ResultSetHeader).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            let data = {
                id: id,
                ...model,
                // code: code,
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
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false) { }
        let addressDefault: any = null;
        let query = `select c.*, cg.name as group_name, ct.name as city_name, dt.name as district_name, wd.name  as ward_name from ${this.tableName} c left join customer_group cg on c.group_id = cg.id  left join city ct on c.city_id = ct.id left join district dt on dt.id = c.district_id left join ward wd on c.ward_id = wd.id where c.id = ?`;
        addressDefault = await this.userAddressService.findDefaultAddressByCustomerId(id);
        if (addressDefault instanceof Error) { } else {
            delete (addressDefault as RowDataPacket).data[0].customer_id;
            addressDefault = (addressDefault as RowDataPacket).data[0];
        }
        const result = await database.executeQuery(query, [id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        let checkUserManager = null;
        let manager_name_phone = '';
        let manager_name = '';

        try {
            if ((check as RowDataPacket)[0].magnager_id && (check as RowDataPacket)[0].magnager_id != undefined) {
                checkUserManager = await checkExist('users', 'id', (check as RowDataPacket)[0].manager_id.toString())
                if (checkUserManager && checkUserManager[0] != undefined) {
                    manager_name_phone = checkUserManager[0].name + ' ' + checkUserManager[0].phone;
                    manager_name = checkUserManager[0].name;
                }
            }
        } catch (error) {

        }
        return {
            data: {
                ...(result as RowDataPacket[])[0],
                address_default: addressDefault,
                address_default_id: addressDefault ? addressDefault.id : null,
                manager_name_phone: manager_name_phone,
                manager_name: manager_name,
            }
        }
    }
    public searchs = async (key: string, code: string, name: string, phone: string, email: string, tax_code: string, type: number, group_id: number, publish: boolean, page: number, limit: number, manager_id: number, created_id: number, employee_id: number, city_id: number, district_id: number, ward_id: number, gender: number, birthdate: string, seller_id: number, isLocation: boolean, role_id: number) => {
        let query = `select c.*, cg.name as group_name, ct.name as city_name, dt.name as district_name, wd.name as ward_name from ${this.tableName} c left join customer_group cg on c.group_id = cg.id  left join city ct on c.city_id = ct.id left join district dt on c.district_id = dt.id left join ward wd on c.ward_id = wd.id where 1=1`;
        let countQuery = `select count(*) as total 
                  from ${this.tableName} c 
                  left join customer_group cg on c.group_id = cg.id 
                  left join city ct on c.city_id = ct.id 
                  left join district dt on c.district_id = dt.id 
                  left join ward wd on c.ward_id = wd.id 
                  where  1=1`;
        if (key && key.length != 0) {
            query += ` and (c.code like '%${key}%' or c.name like '%${key}%' or c.phone like '%${key}%' or c.email like '%${key}%' or c.tax_code like '%${key}%')`
            countQuery += ` and (c.code like '%${key}%' or c.name like '%${key}%' or c.phone like '%${key}%' or c.email like '%${key}%' or c.tax_code like '%${key}%')`
        }
        // if (manager_id != null && created_id != 1) {
        //     query += ` and c.manager_id = ${manager_id}`
        //     countQuery += ` and c.manager_id = ${manager_id}`
        // }
        if (employee_id != undefined) {
            query += ` and c.manager_id = ${employee_id}`
            countQuery += ` and c.manager_id = ${employee_id}`
        }
        if (code && code.length != 0) {
            query += ` and c.code like '%${code}%'`
            countQuery += ` and c.code like '%${code}%'`
        }
        if (name && name.length != 0) {
            query += ` and c.name like '%${name}%'`
            countQuery += ` and c.name like '%${name}%'`
        }
        if (phone && phone.length != 0) {
            query += ` and c.phone like '%${phone}%'`
            countQuery += ` and c.phone like '%${phone}%'`
        }
        if (email && email.length != 0) {
            query += ` and c.email like '%${email}%'`
            countQuery += ` and c.email like '%${email}%'`
        }
        if (tax_code != undefined) {
            query += ` and c.tax_code like ${tax_code}`
            countQuery += ` and c.tax_code like ${tax_code}`
        }
        if (group_id != undefined) {
            query += ` and c.group_id = ${group_id}`
            countQuery += ` and c.group_id = ${group_id}`
        }
        if (type != undefined) {
            query += ` and c.type = ${type}`
            countQuery += ` and c.type = ${type}`
        }
        if (isLocation == true) {
            query += ` and c.longitude != 0 and c.latitude != 0`
            countQuery += ` and c.longitude != 0 and c.latitude != 0`
        }
        if (isLocation == false) {
            query += ` and c.longitude = 0 and c.latitude = 0`
            countQuery += ` and c.longitude = 0 and c.latitude = 0`
        }
        let values = []

        if (publish != undefined) {
            query += ` and c.publish = ?`
            countQuery += ` and c.publish = ?`
            values.push(publish)
        }
        if (city_id != undefined) {
            city_id = Number.parseInt(city_id as any)
            query += ` and c.city_id = ? `
            countQuery += ` and c.city_id = ? `;
            values.push(city_id)
        }
        if (district_id != undefined) {
            query += ` and c.district_id = ? `
            countQuery += ` and c.district_id = ? `;
            values.push(district_id)
        }
        if (ward_id != undefined) {
            query += ` and c.ward_id = ?`
            countQuery += ` and c.ward_id = ?`
            values.push(ward_id)
        }
        if (gender != undefined) {
            gender = Number.parseInt(gender as any)
            query += ` and c.gender = ?`
            countQuery += ` and c.gender = ?`
            values.push(gender)
        }
        if (birthdate != undefined) {
            query += ` and c.birthdate like ?`
            countQuery += ` and c.birthdate like ?`
            values.push(birthdate)
        }
        if (seller_id != undefined) {
            query += ` and c.seller_id = ?`
            countQuery += ` and c.seller_id = ?`
            values.push(seller_id)
        }

        if (created_id !== undefined && created_id != 1 && role_id) {
            if (role_id === 1 || role_id === 3) {
            }
            else {
                const queryCheck = `
                            SELECT p.id as module_name FROM permission p
                            left join module_detail md on md.id = p.module_detail_id
                            left join module m on m.id = md.module_id
                            where p.role_id = ? and md.action = 'index-all' and m.url = 'customers'
                        `
                const checkRole = await database.executeQuery(queryCheck, [role_id]) as RowDataPacket
               //console.log(checkRole)
                if (checkRole.length === 0) {
                    query += ` and manager_id = ?`;
                    countQuery += ` and manager_id = ?`
                    values.push(created_id)
                }
            }
        }

        query += ` order by c.id desc `
       //console.log(query, values)
        if (page && page < 1 || page && limit < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (page && limit)
            query = query + ` LIMIT ` + limit + ` OFFSET ` + (page - 1) * limit;
        let pagination: IPagiantion = {
            page: page,
            limit: limit,
            totalPage: 0
        }
       //console.log("query", query);
       //console.log("values", values);



        const count = await database.executeQuery(countQuery, values);
        const totalPages = Math.ceil((count as RowDataPacket[])[0].total / limit);
        if (Array.isArray(count) && count.length > 0)
            pagination.totalPage = totalPages;
        const result = await database.executeQuery(await addCollate(query), values);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        for (let i = 0; i < (result as RowDataPacket[]).length; i++) {
            // (result as RowDataPacket)[i].group_code = (result as RowDataPacket)[i].code_customer_group
            if ((result as any)[i].magnager_id && (result as any)[i].magnager_id != undefined) {
                const checkUserManager = await checkExist('users', 'id', (result as any)[i].magnager_id.toString())
                if (checkUserManager && checkUserManager[0] != undefined) {
                    (result as any)[i].manager_name_phone = checkUserManager[0].name + ' ' + checkUserManager[0].phone;
                    (result as any)[i].manager_name = checkUserManager[0].name;
                }
            }
        }
        return {
            data: result,
            pagination: pagination
        }
    }
    public searchsUpdate = async (key: string, code: string, name: string, phone: string, email: string, tax_code: string, type: number, group_id: number, publish: boolean, page: number, limit: number, manager_id: number) => {
        let query = `select *  from ${this.tableName} where 1=1`;
        let countQuery = `select count(*) as total 
                  from ${this.tableName} 
                  where 1=1`;
        if (key && key.length != 0) {
            query += ` and (code like '%${key}%' or name like '%${key}%' or phone like '%${key}%' or email like '%${key}%' or tax_code like '%${key}%')`
            countQuery += ` and (code like '%${key}%' or name like '%${key}%' or phone like '%${key}%' or email like '%${key}%' or tax_code like '%${key}%')`
        }
        if (manager_id != null) {
            query += ` and created_id = ${manager_id}`
            countQuery += ` and created_id = ${manager_id}`
        }
        if (code && code.length != 0) {
            query += ` and code like '%${code}%'`
            countQuery += ` and code like '%${code}%'`
        }
        if (name && name.length != 0) {
            query += ` and name like '%${name}%'`
            countQuery += ` and name like '%${name}%'`
        }
        if (phone && phone.length != 0) {
            query += ` and phone like '%${phone}%'`
            countQuery += ` and phone like '%${phone}%'`
        }
        if (email && email.length != 0) {
            query += ` and email like '%${email}%'`
            countQuery += ` and email like '%${email}%'`
        }
        if (tax_code != undefined) {
            query += ` and tax_code like ${tax_code} `
            countQuery += ` and tax_code like ${tax_code} `
        }
        if (group_id != undefined) {
            query += ` and group_id = ${group_id} `
            countQuery += ` and group_id = ${group_id} `
        }
        if (type !== undefined) {
            query += ` and type = ${type} `
            countQuery += ` and type = ${type} `
        }
        if (publish !== undefined) {
            query += ` and publish = ${publish} `
            countQuery += ` and publish = ${publish} `
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
        let result = await database.executeQuery(query);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        // for (let i = 0; i < (result as RowDataPacket[]).length; i++) {
        //     (result as RowDataPacket)[i].group_code = (result as RowDataPacket)[i].code_customer_group
        // }
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
            const getPublish = await database.executeQuery(`select publish from ${this.tableName} where id = ? `, [id]);
            if ((getPublish as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND, 'id');
            const log: Ilog = {
                action: errorMessages.UPDATE_STATUS,
                user_id: model.created_id!,
                module_id: this.moduleId,
            }
            if ((getPublish as RowDataPacket[])[0].publish == 0) {
                publish = 1
                result = await database.executeQueryLog(`update ${this.tableName} set publish = ?, updated_at = ? where id = ? `, [publish, update_at, id], log);
            }
            if ((getPublish as RowDataPacket[])[0].publish == 1) {
                result = await database.executeQueryLog(`update ${this.tableName} set publish = ?, updated_at = ? where id = ? `, [publish, update_at, id], log);
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
    private addToErrors = (info: IError, errors: IError[], STT: string, newMsg: string) => {
        const existingError = errors.find(err => err.STT == STT);
        if (existingError) {
            existingError.Msg += `, ${newMsg} `;
        } else {
            info.STT = STT;
            info.Msg = newMsg;
            errors.push({ ...info });
        }
    };
    public convertExcelDateToDate = (value: any): Date | null => {
        if (value instanceof Date)
            return value
        if (typeof value === 'string') {
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date
        }
        if (typeof value === 'number') {
            const excelStartDate = new Date(1899, 11, 30);
            return new Date(excelStartDate.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
        }
        return null;
    }

    public formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${year} -${month} -${day} `
    }
    private extractContacts = (data: string): { name: string, phone: string } | null => {
        const regex = /(.+?)\s(\d{10})/g;
        let match = regex.exec(data);
        if (match) {
            const name = match[1];
            const phone = match[2];
            return { name, phone };
        }
        return null
    }
    public importExcelUpdate = async (file: any, created_id: number) => {
        if (!file) {
            return new HttpException(400, errorMessages.FILE_NOT_FOUND, 'file');
        }
        const workBook = xlsx.read(file.buffer, { type: 'buffer' })
        const sheetName = workBook.SheetNames[0];
        const sheet = workBook.Sheets[sheetName];
        //console.log("sheet", sheet);

        const data = xlsx.utils.sheet_to_json(sheet, { raw: true });
        //console.log("data", data);

        const dataFiltered: any[] = [];
        let errors: IError[] = []

        const rowCount = data.length
        const maxRows = 2000

        if (rowCount > maxRows)
            return new HttpException(400, errorMessages.MAX_ROW_EXCEL + ` ${maxRows} dòng.`);

        let results: any[] = [];
        try {
            data.forEach((element: any, i: number) => {
                let birthdateDate;
                let birthdate;
                let index = i + 1;
                let STT = (index + 1).toString();
                let name = element['Tên khách hàng *'] ? element['Tên khách hàng *'].toString() : '';
                let code = element['Mã khách hàng'] ? element['Mã khách hàng'].toString() : '';
                let codeCustomerGroup = element['Mã nhóm khách hàng'] ? element['Mã nhóm khách hàng'].toString() : '';
                let email = element['Email'] ? element['Email'].toString() : '';
                let phone = element['Điện thoại'] ? element['Điện thoại'].toString() : '';
                let birthdateExcel = element['Ngày sinh'] ? element['Ngày sinh'] : '';
                if (birthdateExcel != undefined) {
                    birthdateDate = this.convertExcelDateToDate(birthdateExcel);
                    birthdate = birthdateDate ? this.formatDate(birthdateDate) : '';
                }
                let gender = element['Giới tính'] ? element['Giới tính'].toString() : '';
                let address = element['Địa chỉ'] ? element['Địa chỉ'].toString() : '';
                let cityNameExcel = element['Tỉnh thành'] ? element['Tỉnh thành'].toString() : '';
                let districtNameExcel = element['Quận huyện'] ? element['Quận huyện'].toString() : '';
                let wardNameExcel = element['Phường xã'] ? element['Phường xã'].toString() : '';
                let tax_code = element['Mã số thuế'] ? element['Mã số thuế'].toString() : '';
                let manager = element['Nhân viên phụ trách'] ? element['Nhân viên phụ trách'].toString() : '';
                dataFiltered.push({ STT, name, code, codeCustomerGroup, email, phone, birthdate, gender, address, cityNameExcel, districtNameExcel, wardNameExcel, tax_code, manager });
            });
            for (let i = 0; i < dataFiltered.length; i++) {
                let info: IError = {
                    STT: '',
                    Msg: ''
                };
                let code;
                if (dataFiltered[i]['code'] && dataFiltered[i]['code'].length > 0) {
                    code = dataFiltered[i]['code']
                }
                let codeCustomerGroup;
                let group_id;
                if (code && code.length > 0) {
                    let checkCode = await checkExist(this.tableName, 'code', code.toString())
                    if (checkCode && checkCode.length > 0)
                        this.addToErrors(info, errors, dataFiltered[i]['STT'], errorMessages.CODE_EXISTED);
                    } else code = await generateCodeWithPrefix('customers', 'KH', 8);
                if (dataFiltered[i]['codeCustomerGroup'] && dataFiltered[i]['codeCustomerGroup'].length > 0) {
                    let query = 'select * from customer_group where code = ?'
                    let checkGroup = await database.executeQuery(query, [dataFiltered[i]['codeCustomerGroup']])
                    if (checkGroup && Array.isArray(checkGroup) && checkGroup.length > 0) {
                        codeCustomerGroup = (checkGroup as any)[0].code
                        group_id = (checkGroup as any)[0].id
                    }
                    else {
                        dataFiltered[i]['codeCustomerGroup'] = 0
                        group_id = 0
                    }
                }
                if (dataFiltered[i]['gender']) {
                    if (dataFiltered[i]['gender'] == 'Nam') dataFiltered[i]['gender'] = 1
                    else if (dataFiltered[i]['gender'] == 'Nữ') dataFiltered[i]['gender'] = 2
                    else dataFiltered[i]['gender'] = 0
                }
                let queryCity = `SELECT * FROM ${this.tableCity} WHERE '${dataFiltered[i]['cityNameExcel']}' LIKE CONCAT('%', name, '%')`;
                let city: any = await database.executeQuery(queryCity);
                let district
                let ward
                if (city && Array.isArray(city) && city.length === 0)
                    city = null
                else {
                    let queryDistrict = `SELECT * FROM ${this.tableDistrict} WHERE '${dataFiltered[i]['districtNameExcel']}' LIKE CONCAT('%', name, '%') AND city_id = ${(city as RowDataPacket)[0].id} `;
                    district = await database.executeQuery(queryDistrict);
                    if (district && Array.isArray(district) && district.length === 0)
                        district = null
                    else {
                        let queryWard = `SELECT * FROM ${this.tableWard} WHERE '${dataFiltered[i]['wardNameExcel']}' LIKE CONCAT('%', name, '%') AND district_id = ${(district as RowDataPacket)[0].id} `;
                        ward = await database.executeQuery(queryWard);
                        if (ward && Array.isArray(ward) && ward.length === 0)
                            ward = null
                    }
                }

                let managerId = 0;
                if (dataFiltered[i]['manager'] && dataFiltered[i]['manager'].length > 0) {
                    const getPhoneManager = this.extractContacts(dataFiltered[i]['manager']);
                    let checkManager;
                    if (getPhoneManager != null) {
                        checkManager = await database.executeQuery(`SELECT * FROM users WHERE phone = ? `, [getPhoneManager?.phone]);
                        if (checkManager && (checkManager as RowDataPacket).length > 0) {
                            managerId = (checkManager as RowDataPacket)[0].id;
                        }
                    } else managerId = 0
                }
                if (info.Msg == null || info.Msg == '') {
                    try {
                        if (dataFiltered[i].phone && dataFiltered[i].phone.length > 10) {
                            // this.addToErrors(info, errors, dataFiltered[i]['STT'], errorMessages.PHONE_NOT_VALID);
                            dataFiltered[i].phone = null
                        }
                        const created_at = new Date()
                        const updated_at = new Date()
                        let query = `INSERT INTO ${this.tableName} (code, name, phone, email, birthdate, address, gender, tax_code, created_id, created_at, updated_at, city_id, district_id, ward_id, group_code, group_id, manager_id)`;
                        query += ` VALUES( ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ?, ?)`;
                        let values = [
                            code,
                            dataFiltered[i].name ? dataFiltered[i].name : null,
                            dataFiltered[i].phone ? dataFiltered[i].phone : null,
                            dataFiltered[i].email ? dataFiltered[i].email : null,
                            dataFiltered[i].birthdate ? dataFiltered[i].birthdate : null,
                            dataFiltered[i].address ? dataFiltered[i].address : null,
                            dataFiltered[i].gender ? dataFiltered[i].gender : 2,
                            dataFiltered[i].tax_code ? dataFiltered[i].tax_code : null,
                            created_id,
                            created_at,
                            updated_at,
                            city ? (city as RowDataPacket)[0].id : 0,
                            district ? (district as RowDataPacket)[0].id : 0,
                            ward ? (ward as RowDataPacket)[0].id : 0,
                            codeCustomerGroup ? codeCustomerGroup : 0,
                            group_id ? group_id : 0,
                            managerId ? managerId : 0
                        ]
                        const result = await database.executeQuery(query, values);
                        if ((result as any).affectedRows === 0) {
                            this.addToErrors(info, errors, dataFiltered[i]['STT'], errorMessages.CREATE_FAILED);
                        }
                        else {
                            let address: Address = {
                                customer_id: (result as any).insertId,
                                name: dataFiltered[i].name || null,
                                phone: dataFiltered[i].phone || null,
                                address: dataFiltered[i].address || null,
                                city_id: city ? (city as RowDataPacket)[0].id : 0,
                                district_id: district ? (district as RowDataPacket)[0].id : 0,
                                ward_id: ward ? (ward as RowDataPacket)[0].id : 0,
                                is_default: 1,
                                created_id: created_id,
                            }
                            let query = `insert into user_address (name, phone, city_id, district_id, ward_id, address, created_id, customer_id, is_default) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                            const resultAddress = await database.executeQuery(query, [address.name, address.phone, address.city_id, address.district_id, address.ward_id, address.address, address.created_id, address.customer_id, address.is_default]);
                            if ((resultAddress as any).affectedRows === 0) {
                                this.addToErrors(info, errors, dataFiltered[i]['STT'], errorMessages.CREATE_FAILED);
                            }
                        }
                        let data = {
                            id: (result as any).insertId,
                            ...dataFiltered[i],
                            code: code,
                            created_at: created_at,
                            updated_at: updated_at
                        }
                        results.push(data)
                    } catch (error) {
                        this.addToErrors(info, errors, dataFiltered[i]['STT'], errorMessages.CREATE_FAILED);
                    }
                }
            }
            return {
                message: `Tổng số dòng: ${dataFiltered.length}, Số dòng thêm thành công: ${results.length}, Số dòng thất bại: ${dataFiltered.length - results.length} `,
                total: dataFiltered.length,
                successTotal: results.length,
                failedTotal: dataFiltered.length - results.length,
                results: results,
                errors: errors
            }

        } catch (error) { }
    }


    public statistics = async (seller_id: number) => {
        let countQuery = `SELECT
            COUNT(CASE WHEN type = 0 THEN 1 END) AS totalTypeIndividual,
                COUNT(CASE WHEN type = 1 THEN 1 END) AS totalTypeBusiness,
                    COUNT(CASE WHEN publish = 1 THEN 1 END) AS totalPublish,
                        COUNT(CASE WHEN publish = 0 THEN 1 END) AS totalUnPublish,
                            COUNT(*) AS total
        FROM ${this.tableName} where 1=1 `;
        if (seller_id != undefined) {
            countQuery += ` and seller_id = ${seller_id}`
        }
        const result = await database.executeQuery(countQuery);
        return {
            data: (result as RowDataPacket[])[0]
        }
    }
    public deleteRows = async (model: CreateDto, data: number[]) => {
        const log: Ilog = {
            action: errorMessages.DELETE_LIST,
            user_id: model.created_id!,
            module_id: this.moduleId,
            des: {
                id: data
            }
        }
        let query = `delete from ${this.tableName} where id in (${data})`
        const result = await database.executeQueryLog(query, undefined, log);
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
    public reportCustomerQuantity = async (created_id: number, seller_id: number) => {
        let query = ``;
        let result: any;
        if (created_id != 1) {
            query = `select count(*) as total_customer from customers where and seller_id  = ? manager_id = ? group by manager_id, seller_id`;
            result = await database.executeQuery(query, [seller_id, created_id]);
        } else {
            query = `select count(*) as total_customer from customers where seller_id = ? group by seller_id`;
            result = await database.executeQuery(query, [seller_id]);
        }
        return {
            data: result
        }
    }
}
export default CustomerSerivces;