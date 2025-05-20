import { HttpException } from "@core/exceptions";
import database from "@core/config/database";
import { RowDataPacket } from "mysql2/promise";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import { SellerService } from "@modules/seller";
class BusinessTypeTaxService {
    private tableName = 'business_type_tax';
    private sellerService = new SellerService();

    public getTaxVATInForSeller = async (seller_id: number) => {
        const sellerRow = await this.sellerService.getOne(seller_id);
        if (sellerRow instanceof Error)
            return new HttpException(404, errorMessages.NOT_FOUND, 'seller_id');
        
        const business_type_id = sellerRow.data.business_type_id;

        let query = `SELECT tax_value FROM ${this.tableName} WHERE business_type_id = ? AND object_type = ? AND tax_type = ? `;
        const result = await database.executeQuery(query, [business_type_id, 'seller', 1]);

        // const resultArr = result as RowDataPacket[];
        // const checkValue = resultArr.find(rs => rs.tax_vat == 0);
        // //console.log(checkValue);

        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.FIND_ALL_FAILED);
        return {
            data: result
        };
    }
    public getTaxVATOutForSeller = async (seller_id: number) => {
        const sellerRow = await this.sellerService.getOne(seller_id);
        if (sellerRow instanceof Error)
            return new HttpException(404, errorMessages.NOT_FOUND, 'seller_id');
        
        const business_type_id = sellerRow.data.business_type_id;

        let query = `SELECT tax_value FROM ${this.tableName} WHERE business_type_id = ? AND object_type = ? AND tax_type = ? `;
        const result = await database.executeQuery(query, [business_type_id, 'seller', 1]);

        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.FIND_ALL_FAILED);
        return {
            data: result
        };
    }
    public getTaxTncnForSeller = async (seller_id: number) => {
        const sellerRow = await this.sellerService.getOne(seller_id);
        if (sellerRow instanceof Error)
            return new HttpException(404, errorMessages.NOT_FOUND, 'seller_id');
        
        const business_type_id = sellerRow.data.business_type_id;

        let query = `SELECT tax_value FROM ${this.tableName} WHERE business_type_id = ? AND object_type = ? AND tax_type = ? `;
        const result = await database.executeQuery(query, [business_type_id, 'seller', 2]);

        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.FIND_ALL_FAILED);
        return {
            data: result
        };
    }
    public getTaxVATForAffiliate = async (seller_id: number) => {
        const sellerRow = await this.sellerService.getOne(seller_id);
        if (sellerRow instanceof Error)
            return new HttpException(404, errorMessages.NOT_FOUND, 'seller_id');
        
        const business_type_id = sellerRow.data.business_type_id;

        let query = `SELECT tax_value FROM ${this.tableName} WHERE business_type_id = ? AND object_type = ? AND tax_type = ? `;
        const result = await database.executeQuery(query, [business_type_id, 'affiliate', 1]);

        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.FIND_ALL_FAILED);
        return {
            data: result
        };
    }
    public getTaxTncnForAffiliate = async (seller_id: number) => {
        const sellerRow = await this.sellerService.getOne(seller_id);
        if (sellerRow instanceof Error)
            return new HttpException(404, errorMessages.NOT_FOUND, 'seller_id');
        
        const business_type_id = sellerRow.data.business_type_id;

        let query = `SELECT tax_value FROM ${this.tableName} WHERE business_type_id = ? AND object_type = ? AND tax_type = ? `;
        const result = await database.executeQuery(query, [business_type_id, 'affiliate', 2]);

        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.FIND_ALL_FAILED);
        return {
            data: result
        };
    }
}

export default BusinessTypeTaxService;