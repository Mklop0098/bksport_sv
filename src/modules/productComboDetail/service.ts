import errorMessages from "@core/config/constants";
import database from "@core/config/database";
import { HttpException } from "@core/exceptions";
import { RowDataPacket } from "mysql2";
import { CreateDto } from "./dtos/create.dto";
import { checkExist } from "@core/utils/checkExist";
class ProductComboDetailService {

    private tableName = 'product_combo_detail'

    public create = async (model: CreateDto) => {
        try {
            const query = `INSERT INTO ${this.tableName} (combo_id, product_id, quantity, price, discount_type, discount_value, price_combo) VALUES (?, ?, ?, ?, ?, ?, ?)`
            const params = [model.combo_id, model.product_id, model.quantity, model.price, model.discount_type || null, model.discount_value || null, model.price_combo || null ]
            console.log(query, params)
            const result = await database.executeQuery(query, params) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.CREATE_FAILED)
            }
            return result
        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED)
        }
    };
    public getByComboId = async (combo_id: number) => {
        try {
            const query = `
                SELECT 
                    pcd.id,
                    p.name,
                    p.code,
                    pcd.product_id,
                    pcd.quantity,
                    pcd.price,
                    pcd.price_combo,
                    pcd.price_combo * pcd.quantity as total_price,
                    pcd.discount_type,
                    pcd.discount_value,
                    IFNULL((select CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', COALESCE((select code from product where id = (select parent_id from product where id = pcd.product_id)), (select code from product where id = pcd.product_id)), '/', pi.image) from product_image pi where product_id = pcd.product_id limit 1), null) as image
                FROM ${this.tableName} pcd
                LEFT JOIN product p ON p.id = pcd.product_id
                left join product_image pi on pi.product_id = p.id 
                WHERE pcd.combo_id = ?`
            const params = [combo_id]
            
            const result = await database.executeQuery(query, params) as RowDataPacket[]
            if (result.length === 0) {
                return new HttpException(404, errorMessages.NOT_FOUND)
            }
            return {
                data: result.map(item => ({...item, combo_id: combo_id}))
            }
        } catch (error) {
            return new HttpException(400, errorMessages.SEARCH_FAILED)
        }
    }
    
    public deleteRows = async (data: number[]) => {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id IN (${data})`
            const result = await database.executeQuery(query) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(404, errorMessages.NOT_FOUND)
            }
            return {
                data: {
                    message: errorMessages.DELETE_SUCCESS,
                    ids: data
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED)
        }
    }

    public update = async (model: CreateDto) => {
        try {
            const check = await database.executeQuery(`SELECT * FROM ${this.tableName} WHERE product_id = ? and combo_id = ?`, [model.product_id, model.combo_id]) as RowDataPacket
            if (check.length === 0) {
                const query = `INSERT INTO ${this.tableName} (combo_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`
                const params = [model.combo_id, model.product_id, model.quantity, model.price]
                const result = await database.executeQuery(query, params) as RowDataPacket
                if (result.affectedRows === 0) {
                    return new HttpException(400, errorMessages.CREATE_FAILED)
                }
                return result
            }
            const query = `UPDATE ${this.tableName} SET combo_id = ?, product_id = ?, quantity = ?, price = ? WHERE product_id = ? and combo_id = ?`
            const params = [model.combo_id, model.product_id, model.quantity, model.price, model.product_id, model.combo_id]
            const result = await database.executeQuery(query, params) as RowDataPacket
            if (result.affectedRows === 0) {    
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }
            return result
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }   
}

export default ProductComboDetailService;
