import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar } from "@core/utils/gennerate.code";

class WeightUnitService {

    private tableName = 'weight_unit';

    public getAllWeightUnit = async () => {
        try {
            const unFollowQuery = `
                SELECT id, name FROM ${this.tableName} 
            `
            const result = await database.executeQuery(unFollowQuery) as RowDataPacket
            return {
                data: result
            }

        } catch (error) {
            return new HttpException(400, errorMessages.NOT_FOUND)
        }
    }

}

export default WeightUnitService