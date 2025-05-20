import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { ConvertStringToNumber } from "@core/utils/convertStringToNumber";

class PurchaseOrderDetailService {
    private tableName = 'purchase_order_detail';
    private fieldId = 'id'
    public create = async (model: CreateDto) => {
        let inventory = model.quantity || 0
        if (model.branch_id != undefined) {
            const inventoryQuery = `
                select w.quantity from warehouse w 
                where w.product_id = ? and w.branch_id = ?`
            const result = await database.executeQuery(inventoryQuery, [model.product_id, model.branch_id]) as RowDataPacket
            inventory = result.length > 0 ? result[0].quantity + (model.quantity || 0) : (model.quantity || 0)
        }

        let query = `insert into ${this.tableName} (order_id, product_id, quantity, prime_cost, discount_value, discount_type , seller_id, price, inventory) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const created_at = new Date()
        const values = [
            model.order_id || null,
            model.product_id || null,
            model.quantity || 0,
            model.price ? ConvertStringToNumber.convertStringToFloat(model.price as any) : 0,
            model.discount_value || 0,
            model.discount_type || 0,
            model.seller_id || 0,
            model.price ? ConvertStringToNumber.convertStringToFloat(model.price as any) : 0,
            inventory
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
        if (model.discount_value != undefined) {
            query += `discount_value = ?, `
            values.push(model.discount_value)
        }
        if (model.discount_type != undefined) {
            query += `discount_type = ?, `
            values.push(model.discount_type)
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
    public findAllOrderDetailByOrderId = async (order_id: number) => {
        // let query = `select od.*, p.unit_id as unit_id, pu.name as unit_name, 0 as discount from ${this.tableName} od left join product p on od.product_id = p.id left join product_unit pu on pu.id = p.unit_id where od.order_id = ?`
        let query = `select 
        od.*, p.unit_id as unit_id, pu.name as unit_name, p.max_inventory, p.min_inventory
        from ${this.tableName} od 
        left join product p on od.product_id = p.id 
        left join product_unit pu on pu.id = p.unit_id 
        where od.order_id = ?`
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

    // public createMultipleRows = async (order_details: CreateDto[]) => {
    //     let values = []
    //     for (let element of order_details) {
    //        //console.log(element)
    //         const regex = /^(0|[1-9]\d*(\.\d+)?|\.\d+)$/;
    //         if (!regex.test((element as RowDataPacket).price)) {
    //             return new HttpException(400, errorMessages.PRICE_MUST_GREATER_THAN_ZERO, 'price');
    //         }
    //         values.push()
    //         resultOrderDetail = await this.orderDetailService.create({
    //             order_id: order_id,
    //             product_id: element.product_id,
    //             quantity: element.quantity,
    //             price: element.price,
    //             created_id: model.created_id,
    //             discount_value: element.discount_value || 0,
    //             discount_type: element.discount_type || 0,
    //             seller_id: model.seller_id,
    //             branch_id: model.branch_id
    //         })
    //         orderDetailResult.push((resultOrderDetail as any).data)
    //     }
    //     const query =`
    //         insert into ${this.tableName} 
    //         (order_id, product_id, quantity, prime_cost, discount_value, discount_type , seller_id, price, inventory) 
    //         values (?, ?, ?, ?, ?, ?, ?, ?, ?), ()
    //     `
    // }
}

export default PurchaseOrderDetailService;