import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { ConvertStringToNumber } from "@core/utils/convertStringToNumber";

class OrderDetailService {
    private tableName = 'order_detail';
    private fieldId = 'id'
    public create = async (model: CreateDto) => {
        console.log('model', model)
        let query = `insert into ${this.tableName} (order_id, product_id, quantity, price, price_wholesale, discount_value, discount_type, price_type , seller_id, branch_id, combo_id) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const created_at = new Date()
        const values = [
            model.order_id || null,
            model.product_id || null,
            model.quantity || 0,
            model.price ? ConvertStringToNumber.convertStringToFloat(model.price as any) : 0,
            model.price_wholesale ? ConvertStringToNumber.convertStringToFloat(model.price_wholesale as any) : 0,
            model.discount_value || 0,
            model.discount_type || 0,
            model.price_type || 1,
            model.seller_id || 0,
            model.branch_id || null,
            model.combo_id || null
        ]
        const result = await database.executeQuery(query, values);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED)
        return {
            data: {
                id: (result as any).insertId,
                ...model,
                created_at: created_at,
                updated_at: created_at
            }
        }
    }
    public update = async (model: CreateDto, id: number) => {
        if (!await checkExist(this.tableName, this.fieldId, id.toString()))
            return new HttpException(400, errorMessages.EXISTED, this.fieldId);
        let query = `update ${this.tableName} set `
        let values = []
        if (model.quantity != undefined) {
            query += `quantity = ?, `
            values.push(model.quantity)
        }
        if (model.price != undefined) {
            query += `price = ?, `
            values.push(model.price)
        }
        if (model.price_wholesale != undefined) {
            query += `price_wholesale = ?, `
            values.push(model.price_wholesale)
        }
        if (model.discount_value != undefined) {
            query += `discount_value = ?, `
            values.push(model.discount_value)
        }
        if (model.discount_type != undefined) {
            query += `discount_type = ?, `
            values.push(model.discount_type)
        }
        if (model.seller_id != undefined) {
            query += `seller_id = ?, `
            values.push(model.seller_id)
        }
        query += `updated_at = ? where id = ?`
        const updated_at = new Date()
        values.push(updated_at)
        values.push(id)
        const result = await database.executeQuery(query, values)
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        return {
            data: {
                id: id,
                ...model,
                updated_at: updated_at
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
    public searchs = async (key: string, name: string, publish: boolean, page: number, limit: number) => {
        let query = `select * from ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;
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
    public findAllOrderDetailByOrderId = async (order_id: number, with_combo: boolean = false) => {
        // let query = `select od.*, p.unit_id as unit_id, pu.name as unit_name, 0 as discount from ${this.tableName} od left join product p on od.product_id = p.id left join product_unit pu on pu.id = p.unit_id where od.order_id = ?`
        let query = `
            select od.*, p.unit_id as unit_id, pu.name as unit_name 
            from ${this.tableName} od 
            left join product p on od.product_id = p.id 
            left join product_unit pu on pu.id = p.unit_id 
            where od.order_id = ? ${with_combo ? 'and od.combo_id is null' : ''}
        `
        const result = await database.executeQuery(query, [order_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND + " order_id");
        return {
            data: result
        }
    }
    public findOrderDetailByOrderId = async (order_id: number) => {
        let query = `select * from ${this.tableName} where order_id = ?`
        const result = await database.executeQuery(query, [order_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result
        }
    }

    public findOrderDetailByOrderIdAndComboId = async (order_id: number, combo_id: number) => {
        let query = `
            select 
            p.id as id,
            p.code as code,
            p.name as name,
            p.id as product_id,
            od.quantity as quantity,
            od.price_wholesale as price,
            od.price_wholesale as price_combo,
            od.price_wholesale * od.quantity as total_price,
            od.discount_value as discount_value,
            od.discount_type as discount_type,
            IFNULL((select CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', COALESCE((select code from product where id = (select parent_id from product where id = p.id)), p.code), '/', pi.image) from product_image pi where product_id = p.id limit 1), null) as image

            from ${this.tableName} od 
            left join product p on od.product_id = p.id 
            left join product_unit pu on pu.id = p.unit_id 
            left join product_image pi on pi.product_id = p.id
            where od.order_id = ? and od.combo_id = ?
        `
        const result = await database.executeQuery(query, [order_id, combo_id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result
        }   

        // "id": 115,
        //                 "name": "Áo Sơ Mi Nam Công Sở Trung Niên Thương Hiệu Anton Dài Tay Công Sở Vải Cotton Xanh Dương -A14-42",
        //                 "code": "S0000006SP000067",
        //                 "product_id": 748,
        //                 "quantity": 1,
        //                 "price": 250000,
        //                 "price_combo": 200000,
        //                 "total_price": 200000,
        //                 "discount_type": 2,
        //                 "discount_value": 50000,
        //                 "image":
    }

}

export default OrderDetailService;