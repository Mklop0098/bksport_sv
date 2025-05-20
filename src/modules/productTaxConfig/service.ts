import { HttpException } from "@core/exceptions";
import database from "@core/config/database";
import { RowDataPacket } from "mysql2/promise";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import { CreateDto } from "@modules/productTaxConfig/dtos/create.dto";
import mysql from "mysql2/promise";
class ProductTaxConfigService {
    private tableName = 'product_tax_config';

    public updateByProductId = async (model: CreateDto, id: number) => {
        const checkExistData = await checkExist(this.tableName, 'product_id', id);
        if (checkExistData == false) {
            const product_id = id;
            try {
                const created_at = new Date()
                const updated_at = '0000-00-00 00:00:00';
                let query = `INSERT INTO ${this.tableName} ( product_id, tax_vat_in, tax_vat_out, tax_product_apply, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`;
                const values = [
                    product_id,
                    model.tax_vat_in,
                    model.tax_vat_out,
                    model.tax_product_apply || 0,
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
        } else {
            const result = await database.executeQuery(`UPDATE ${this.tableName} SET tax_vat_in = ?, tax_vat_out = ?, tax_product_apply = ? WHERE product_id = ?`, [model.tax_vat_in, model.tax_vat_out, model.tax_product_apply, id]);
            if ((result as any).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            return {
                data: {
                    id: id,
                    tax_vat_in: model.tax_vat_in,
                    tax_vat_out: model.tax_vat_out,
                    tax_product_apply: model.tax_product_apply
                }

            }
        }
    }
    public delete = async (id: number) => {
        try {
            const checkExistData = await checkExist(this.tableName, 'product_id', id);
            if (checkExistData) {
                const query = `DELETE FROM ${this.tableName} WHERE product_id = ?`
                const result = await database.executeQuery(query, [id])
                //console.log(result)
                return result
            }
        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED) 
        }

    }
}

export default ProductTaxConfigService;