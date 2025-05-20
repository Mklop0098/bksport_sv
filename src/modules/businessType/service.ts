import { HttpException } from "@core/exceptions";
import database from "@core/config/database";
import { RowDataPacket } from "mysql2/promise";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
class BusinessTypeService {
    private tableName = 'business_type';
    public getAll = async (key: string) => {
        let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
        let countQuery = `SELECT COUNT(*) AS total FROM ${this.tableName} WHERE 1=1`;

        if (key && key.length != 0) {
            query += ` AND name LIKE '%${key}%'`
            countQuery += ` AND name LIKE '%${key}%' `
        }
        
        const result = await database.executeQuery(query);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.FIND_ALL_FAILED);
        
        return {
            data: result,
        }
    }
    public getOne = async (id: number) => {
        const result = await checkExist(this.tableName, 'id', id.toString());
        if (result == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        return {
            data: {
                ...(result as RowDataPacket[])[0]
            }
        };
    }
}

export default BusinessTypeService;