import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { da } from "@faker-js/faker";

class DeliveryNoteDetailService {

    private tableName = 'delivery_note_detail';
    public create = async (model: CreateDto) => {
        const created_at = new Date()
        const updated_at = new Date()

        let inventory = 0
        const inventoryQuery = `
            select w.quantity from warehouse w 
            where w.product_id = ? and w.branch_id = ?
        `
        const inventoryData = await database.executeQuery(inventoryQuery, [model.product_id, model.branch_id]) as RowDataPacket
        inventory = inventoryData.length > 0 ? inventoryData[0].quantity - (model.qty || 0) : (model.qty || 0)
        let query = `insert into ${this.tableName} ( delivery_note_id, product_id, qty, created_id, seller_id, inventory, created_at, updated_at, branch_id, in_combo) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        const result = await database.executeQuery(query, [model.delivery_note_id, model.product_id, model.qty, model.created_id, model.seller_id, inventory, created_at, updated_at, model.branch_id || 0, model.in_combo || 0 ]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED)
        return {
            data: {
                id: (result as any).insertId,
            }
        }
    }
    public update = async (model: CreateDto, id: number) => {
        if (!await checkExist(this.tableName, 'id', id.toString()))
            return new HttpException(404, errorMessages.GROUP_NOT_EXISTED, 'id');
        const updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let query = `update ${this.tableName} set `;
        let params = [];
        if (model.product_id != undefined) {
            query += `product_id = ?, `;
            params.push(model.product_id);
        }
        if (model.qty != undefined) {
            query += `qty = ?, `;
            params.push(model.qty);
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
                ...model,
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
        const result = await checkExist(this.tableName, 'id', id.toString());
        if (result == false)
            return new HttpException(404, errorMessages.GROUP_NOT_EXISTED, 'id');
        return {
            data: (result as any)[0]
        }
    }
    public searchs = async (key: string, name: string, qty: number, page: number, limit: number) => {
        let query = `select * from ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;

        if (qty != undefined) {
            query += ` and qty like '%${qty}%'`
            countQuery += ` and qty like '%${qty}%'`
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
    public deleteRows = async (data: number[]) => {
        let query = `delete from ${this.tableName} where id in (${data})`;
        const result = await database.executeQuery(query);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS
        }
    }
    public findAllByDeliveryNoteId = async (delivery_note_id: number) => {
        let query = `
            select dnd.*, p.name as product_name, dn.code, p.type as product_type,   
            CASE 
                WHEN pi.image IS NOT NULL THEN 
                    JSON_OBJECT(
                        'id', pi.id,
                        'image', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', 
                            COALESCE((SELECT code FROM product WHERE id = p.parent_id), p.code), '/', pi.image),
                        'image_thumbnail', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', 
                            COALESCE((SELECT code FROM product WHERE id = p.parent_id), p.code), '/thumbnail/', pi.image)
                    )
                ELSE NULL 
            END AS image
            from ${this.tableName} dnd
            left join product p on p.id = dnd.product_id 
            left join delivery_note dn on dn.id = dnd.delivery_note_id
            LEFT JOIN product_image pi ON pi.product_id = p.id 
                AND pi.id = (SELECT MIN(id) FROM product_image WHERE product_image.product_id = p.id)
            where dnd.delivery_note_id = ? AND dnd.in_combo = 0
            order by dn.id desc`;
        const result = await database.executeQuery(query, [delivery_note_id]) as RowDataPacket;
        if (result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result.map((item: any) => {return {...item, image: item.image ? JSON.parse(item.image) : null}})
        }
    }
    public groupByProductId = async () => {
        let query = `select dn.product_id,  sum(qty) as quantity , p.name as name, pu.name as unit_name from ${this.tableName} dn left join product p on p.id = dn.product_id left join product_unit pu on pu.id = p.unit_id group by dn.product_id`;

        const result = await database.executeQuery(query);
        //console.log("result", result);

        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result
        }
    }
    public groupByProductIdAndCreatedAt = async (model: any) => {
        //console.log("model", model);

        // fromDate: string, toDate: string, page: number, limit: number
        let query = `select dn.product_id,  sum(qty) as quantity , p.name as name, pu.name as unit_name, 0 as quantity_defective from ${this.tableName} dn left join product p on p.id = dn.product_id left join product_unit pu on pu.id = p.unit_id  `;
        if (model.fromDate && model.toDate && model.fromDate != undefined && model.toDate != undefined) {
            query += `  where dn.created_at  between '${model.fromDate}' and '${model.toDate}'`
        }
        query += ` group by dn.product_id`;


        const count = await database.executeQuery(query);
        if (model.page && model.page < 1 || model.page && model.limit < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (model.page && model.limit)
            query = query + ` LIMIT ` + model.limit + ` OFFSET ` + (model.page - 1) * model.limit;

        const result = await database.executeQuery(query);
        const totalPages = Math.ceil((count as any).length / model.limit);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        const pagination: IPagiantion = {
            page: model.page,
            limit: model.limit,
            totalPage: totalPages
        };

        return {
            data: {
                data: result,
                pagination: pagination
            }
        };
    }
    public groupByProductAndFilter = async (model: any) => {
        let query = `select dn.product_id,  sum(qty) as quantity , p.name as name, pu.name as unit_name, 0 as quantity_defective from ${this.tableName} dn left join product p on p.id = dn.product_id left join product_unit pu on pu.id = p.unit_id  `;
        if (model.fromDate && model.toDate && model.fromDate != undefined && model.toDate != undefined) {
            query += `  where dn.created_at  between '${model.fromDate}' and '${model.toDate}'`
        }
        query += ` group by dn.product_id`;
        const result = await database.executeQuery(query);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND);
        const resultFiler = (result as RowDataPacket).filter((element: any) => {
            return model.listId.includes(element.product_id)
        })
        return {
            data: {
                data: resultFiler,
            }
        };
    }

}

export default DeliveryNoteDetailService;