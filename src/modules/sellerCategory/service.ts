import errorMessages from "@core/config/constants";
import database from "@core/config/database";
import { HttpException } from "@core/exceptions";
import { IPagiantion } from "@core/interfaces";
import { checkExist } from "@core/utils/checkExist";
import { CreateDto } from "@modules/sellerCategory/dtos/create.dto";
import _ from 'lodash';
import { RowDataPacket } from "mysql2";
import path from "path";
class SellerCategoryService {

    private tableName = 'seller_category'

    public create = async (seller_id: number, categories: number[]) => {
        const exist = await checkExist('seller', 'id', seller_id) 
        if (exist == false) {
            return new HttpException(400, errorMessages.SELLER_NOT_FOUND, 'seller')
        }
        try {
            const values = categories.map(category => `(${seller_id}, ${category})`).join(', ');
            const query = `INSERT INTO ${this.tableName} (seller_id, category_id) VALUES ${values}`
            const result = await database.executeQuery(query) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.CREATE_FAILED)
            }

        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED, 'seller_category')
        }
    };

    public deleteOne = async (id: number) => {
        const countQuery = `SELECT id FROM ${this.tableName}`
        const count = await database.executeQuery(countQuery) as RowDataPacket
        if (count.length === 1) {
            return new HttpException(400, errorMessages.MIN_QUANTITY)
        }
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?)`
            const result = await database.executeQuery(query, [id]) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.DELETE_FAILED)
            }

        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED)
        }
    };

    public getSellerCategoryBySellerId = async (id: number) => {
        const exist = await checkExist('seller', 'id', id) 
        if (exist === false) {
            return new HttpException(400, errorMessages.SELLER_NOT_FOUND, 'id')
        }
        try {
            const query = `
                select sc.category_id, c.name as category_name from ${this.tableName} sc
                LEFT join product_category c ON sc.category_id = c.id
                where seller_id = ?
            `
            const result = await database.executeQuery(query, [id]) as RowDataPacket
            return {
                data: result
            }

        } catch (error) {
            return new HttpException(400, errorMessages.SEARCH_FAILED)
        }
    };

    public update = async (seller_id: number, categories: number[]) => {
        const exist = await checkExist('seller', 'id', seller_id) 
        if (exist == false) {
            return new HttpException(400, errorMessages.SELLER_NOT_FOUND, 'seller')
        }
        if (categories.length > 0) {
        try {
                const deleteQuery = `DELETE FROM ${this.tableName} WHERE seller_id = ?`
                await database.executeQuery(deleteQuery, [seller_id])
                const values = categories.map(category => `(${seller_id}, ${category})`).join(', ');
                const query = `INSERT INTO ${this.tableName} (seller_id, category_id) VALUES ${values}`
                const result = await database.executeQuery(query) as RowDataPacket
                if (result.affectedRows === 0) {
                    return new HttpException(400, errorMessages.UPDATE_FAILED)
                }

            } catch (error) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }
        }
    };
}

export default SellerCategoryService;
