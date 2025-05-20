import database from "@core/config/database";
import { HttpException } from "@core/exceptions";
import errorMessages from "@core/config/constants";
import axios from "axios";
import { CreateDto as OrderDto } from '@modules/order/dtos/create.dto'
import { RowDataPacket } from "mysql2";

class WarehouseExportTypeService {
    private tableName = 'warehouse_export_type'

    public getAllType = async () => {
        try {
            const query = `select * from ${this.tableName} where code != 100`
            const result = await database.executeQuery(query) as RowDataPacket
            return {
                data: result
            }
        } catch (error) {
            return new HttpException(404, errorMessages.SEARCH_FAILED)
        }
    }
}

export default WarehouseExportTypeService;