import errorMessages from "@core/config/constants";
import database from "@core/config/database";
import { HttpException } from "@core/exceptions";
import { IPagiantion } from "@core/interfaces";
import { checkExist } from "@core/utils/checkExist";
import { CreateDto } from "@modules/sellerBank/dtos/create.dto";
import _ from 'lodash';
import { RowDataPacket } from "mysql2";
import path from "path";
class SellerBankService {

    private tableName = 'seller_bank'

    public create = async (model: CreateDto) => {
        if (model.seller_id) {
            const exist = await checkExist('seller', 'id', model.seller_id) 
            if (exist == false) {
                return new HttpException(400, errorMessages.SELLER_NOT_FOUND, 'seller')
            }
        }
        try {
            const query = `INSERT INTO ${this.tableName} (seller_id, city_id, bank_id, account_name, account_number, is_default, bank_branch) VALUES (?, ?, ?, ?, ?, ?, ?)`
            const result = await database.executeQuery(query, [model.seller_id, model.city_id || 0, model.bank_id || null, model.account_name || null, model.account_number || null, model.is_default || 0, model.bank_branch || null]) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.CREATE_FAILED)
            }

        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED, 'seller_bank')
        }
    };

    public update = async (model: CreateDto, id?: number) => {
        try {
            let values = []
            let query = `UPDATE ${this.tableName} SET `
            if (model.city_id != undefined) {
                query += `city_id = ?, `
                values.push(model.city_id)
            }
            if (model.bank_id != undefined) {
                query += `bank_id = ?, `
                values.push(model.bank_id)
            }
            if (model.bank_branch != undefined) {
                query += `bank_branch = ?, `
                values.push(model.bank_branch)
            }
            if (model.account_name != undefined) {
                query += `account_name = ?, `
                values.push(model.account_name)
            }
            if (model.account_number != undefined) {
                query += `account_number = ?, `
                values.push(model.account_number)
            }
            const updated_at = new Date()
            query += `updated_at = ? WHERE seller_id = ? AND is_default = 1`
            values.push(updated_at)
            values.push(model.seller_id)
            if (id != undefined) {
                query += ` AND id = ? `
                values.push(id)
            }
            const result = await database.executeQuery(query, values) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }

    public getAllSellerBankBySellerId = async (id: number) => {
        const exist = await checkExist('seller', 'id', id)
        if (exist === false) {
            return new HttpException(400, errorMessages.SELLER_NOT_FOUND, 'id')
        }
        try {
            const query = `
                SELECT c.name as city_name, b.name as bank_name, b.id as bank_id, b.logo as bank_logo, sb.id, sb.bank_branch, sb.account_name, sb.account_number 
                FROM ${this.tableName} sb
                LEFT JOIN bank b ON sb.bank_id = b.id
                LEFT JOIN city c ON sb.city_id = c.id
                WHERE sb.seller_id = ?
            `
            const result = await database.executeQuery(query, [id]) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.SEARCH_FAILED)
            }
        } catch (error) {
            return new HttpException(400, errorMessages.SEARCH_FAILED)
        }
    }

    public updateDefaultBank = async (id: number) => {
        const exist = await checkExist('seller_bank', 'id', id)
        if (exist === false) {
            return new HttpException(400, errorMessages.NOT_EXISTED, 'id')
        }
        const sellerQuery = `SELECT seller_id FROM ${this.tableName} WHERE id = ?`
        const seller_id = await database.executeQuery(sellerQuery, [id]) as RowDataPacket
        try {
            const updateQuery = `
                UPDATE ${this.tableName}
                SET is_default = CASE
                    WHEN id = ? THEN 1
                    ELSE 0
                END
                WHERE seller_id = ?;
            `
            const result = await database.executeQuery(updateQuery, [id, seller_id[0].seller_id]) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
            
        }
    }
}

export default SellerBankService;
