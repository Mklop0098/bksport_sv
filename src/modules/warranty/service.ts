import { HttpException } from "@core/exceptions";
import database from "@core/config/database";
import { RowDataPacket } from "mysql2/promise";
import mysql from "mysql2/promise";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import { Create as CreateDto } from "@modules/warranty/dtos/create.dto";
class WarrantyService {
    private tableName = 'warranty';
    
    public create = async (model: CreateDto) => {
        try {
            const created_at = new Date()
            let query = `INSERT INTO ${this.tableName} ( product_id, warranty_period, warranty_place, warranty_form, warranty_instructions, seller_id, created_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                model.product_id,
                model.warranty_period,
                model.warranty_place || "",
                model.warranty_form || "",
                model.warranty_instructions || "",
                model.seller_id,
                model.created_id,
                created_at,
            ]
            const result = await database.executeQuery(query, values);
            let id = (result as mysql.ResultSetHeader).insertId;

            return {
                data: {
                    id: id,
                    ...model,
                    created_at: created_at,
                }
            }
        } catch (error) {
            return new HttpException(500, errorMessages.CREATE_FAILED);
        }
    }
    public update = async (model: CreateDto, id: number) => {
        const update_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const result = await database.executeQuery(`UPDATE ${this.tableName} SET warranty_period = ?, warranty_place = ?, warranty_form = ?, warranty_instructions = ?, updated_at = ? WHERE product_id = ?`, [model.warranty_period, model.warranty_place, model.warranty_form, model.warranty_instructions, update_at, id]);
        
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        return {
            data: {
                product_id: id,
                warranty_period: model.warranty_period,
                warranty_place: model.warranty_place,
                warranty_form: model.warranty_form,
                warranty_instructions: model.warranty_instructions,
                updated_at: update_at
            }
        }
    }
    
    public delete = async (id: number) => {
        const checkId = await checkExist(this.tableName, 'product_id', id.toString());
        if (!checkId)
            return new HttpException(404, errorMessages.NOT_FOUND, 'product_id');
        const result = await database.executeQuery(`DELETE FROM ${this.tableName} WHERE product_id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            data: {
                message: errorMessages.DELETE_SUCCESS,
                product_id: id
            }
        }
    }
    public getOne = async (id: number) => {
        const result = await checkExist(this.tableName, 'product_id', id.toString());
        if (result == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'product_id');

        return {
            data: {
                ...(result as RowDataPacket[])[0]
            }
        };


    }
}

export default WarrantyService;