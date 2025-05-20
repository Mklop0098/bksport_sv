import { HttpException } from "@core/exceptions";
import database from "@core/config/database";
import { RowDataPacket } from "mysql2/promise";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import { CreateDto } from "@modules/sellerTaxConfig/dtos/create.dto";
import mysql from "mysql2/promise";
class SellerTaxConfigService {
    private tableName = 'seller_tax_config';

    public updateBySellerId = async (model: CreateDto, id: number) => {
        const checkExistData = await checkExist(this.tableName, 'seller_id', id);
        if (checkExistData == false) {
            const seller_id = id;
            try {
                const created_at = new Date()
                const updated_at = '0000-00-00 00:00:00';
                let query = `INSERT INTO ${this.tableName} ( seller_id, tax_vat_in, tax_vat_out, tax_tncn, affiliate_tax_vat, affiliate_tax_tncn, created_at, updated_at, tax_seller_apply) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                const values = [
                    seller_id,
                    model.tax_vat_in,
                    model.tax_vat_out,
                    model.tax_tncn,
                    model.affiliate_tax_vat,
                    model.affiliate_tax_tncn,
                    model.tax_seller_apply,
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
        }else {
            const update_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const result = await database.executeQuery(`UPDATE ${this.tableName} SET tax_vat_in = ?, tax_vat_out = ?, tax_tncn = ?, affiliate_tax_vat = ?, affiliate_tax_tncn = ?, updated_at = ?, tax_seller_apply = ? WHERE seller_id = ?`, [model.tax_vat_in, model.tax_vat_out, model.tax_tncn, model.affiliate_tax_vat, model.affiliate_tax_tncn, update_at, model.tax_seller_apply, id]);
            if ((result as any).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            return {
                data: {
                    id: id,
                    tax_vat_in: model.tax_vat_in,
                    tax_vat_out: model.tax_vat_out,
                    tax_tncn: model.tax_tncn,
                    affiliate_tax_vat: model.affiliate_tax_vat,
                    affiliate_tax_tncn: model.affiliate_tax_tncn,
                    tax_seller_apply: model.tax_seller_apply,
                    updated_at: new Date()
                }
            
            }
        }
    }
    public getRowBySellerId = async (seller_id: number) => {
        const result = await checkExist(this.tableName, 'seller_id', seller_id);
        if (result == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'seller_id');
        return {
            data: {
                ...(result as RowDataPacket[])[0]
            }
        };
    }
}

export default SellerTaxConfigService;