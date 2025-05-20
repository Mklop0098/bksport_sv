import { HttpException } from "@core/exceptions";
import database from "@core/config/database";
import { RowDataPacket } from "mysql2/promise";
import mysql from "mysql2/promise";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import { CreateDto } from "./dtos/create.dto";
class ProductTaxTypeService {
    private tableName = 'product_tax_type';
    public getAll = async (seller_id: number) => {
        let query = `SELECT * FROM ${this.tableName} WHERE seller_id = 0 OR seller_id = ${seller_id} ORDER BY id DESC`;
        const result = await database.executeQuery(query);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.FIND_ALL_FAILED);
        
        return {
            data: result,
        }
    }
    public create = async (model: CreateDto) => {
        const checkName = await checkExist(this.tableName, 'name', model.name);
        if (checkName)
            return new HttpException(400, errorMessages.NAME_EXISTED, 'name');
        
        const checkCode = await checkExist(this.tableName, 'code', model.code);
        if (checkCode)
            return new HttpException(400, errorMessages.CODE_EXISTED, 'code');
            
        try {
            const created_at = new Date()
            const updated_at = '0000-00-00 00:00:00'
            let query = `INSERT INTO ${this.tableName} (name, code, tax_value, seller_id, created_id, created_at , updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                model.name,
                model.code,
                model.tax_value,
                model.seller_id,
                model.created_id,
                created_at,
                updated_at,
            ]
            const result = await database.executeQuery(query, values);
            let id = (result as mysql.ResultSetHeader).insertId;

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
    public update = async (model: CreateDto, id: number, seller_id: number) => {
        if (!await checkExist(this.tableName, 'id', id.toString()))
            return new HttpException(400, errorMessages.EXISTED, 'id');
        if (await checkExist(this.tableName, 'name', model.name, id.toString()))
            return new HttpException(400, errorMessages.NAME_EXIST, 'name');
        if (await checkExist(this.tableName, 'code', model.code, id.toString()))
            return new HttpException(400, errorMessages.CODE_EXISTED, 'code');
        const update_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const result = await database.executeQuery(`UPDATE ${this.tableName} SET name = ?, code = ?, updated_at = ? WHERE id = ? AND seller_id = ?`, [model.name, model.code, update_at, id, seller_id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        return {
            data: {
                id: id,
                name: model.name,
                code: model.code,
                updated_at: new Date()
            }
        }
    }
    
    public delete = async (id: number, seller_id: number) => {
        let query = `SELECT * FROM ${this.tableName} WHERE id = ${id} AND seller_id = ${seller_id} ORDER BY id DESC`;
        const checkExist = await database.executeQuery(query);
        if (Array.isArray(checkExist) && checkExist.length === 0)
            return new HttpException(400, errorMessages.NOT_FOUND);

        const result = await database.executeQuery(`DELETE FROM ${this.tableName} WHERE id = ? AND seller_id = ?`, [id, seller_id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            data: {
                message: errorMessages.DELETE_SUCCESS,
                id: id
            }
        }
    }
    public getOne = async (id: number, seller_id: number) => {
        let query = `SELECT * FROM ${this.tableName} WHERE id = ${id} AND seller_id = ${seller_id} ORDER BY id DESC`;
        const result = await database.executeQuery(query);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.NOT_FOUND);
        
        return {
            data: {
                ...(result as RowDataPacket[])[0]
            },
        }
    }
}

export default ProductTaxTypeService;