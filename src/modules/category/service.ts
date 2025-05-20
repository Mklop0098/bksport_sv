import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar } from "@core/utils/gennerate.code";
import { buildTree, getAllCategory } from "./utils";

class CategoryService {

    private tableName = 'category';

    public getDataForSelect = async () => {
        try {
            const query = `SELECT id, name, parent_id FROM ${this.tableName}`
            const data = await database.executeQuery(query)
            const result = buildTree((data as any))
            return {
                data: result
            }
            
        } catch (error) {
            return new HttpException( 400, errorMessages.FIND_ALL_FAILED )
        }
    }

    public getAllChildById = async (id: number) => {
        try {
            const query = `SELECT id, name, parent_id FROM ${this.tableName}`
            const data = await database.executeQuery(query)
            const result = getAllCategory((data as any), Number(id))
            return result
            
        } catch (error) {
            return new HttpException( 400, errorMessages.FIND_ALL_FAILED )
        }
    }

    public getRootCategories = async () => {
        try {
            const query = `SELECT id, name FROM ${this.tableName} WHERE parent_id = 0 AND type = 3`
            const data = await database.executeQuery(query) as RowDataPacket[]
            return {
                data
            }
            
        } catch (error) {
            return new HttpException( 400, errorMessages.FIND_ALL_FAILED )
        }
    }

}

export default CategoryService