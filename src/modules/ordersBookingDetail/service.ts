import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar, generateCodeWithSeller } from "@core/utils/gennerate.code";

class OrdersBookingDetailService {

    private tableName = 'order_booking_detail';

    public getAllOrdersBookingDetail = async (id: number) => {
        try {
            const unFollowQuery = `
                SELECT f.user_id, u.name FROM ${this.tableName} f
                LEFT JOIN users u ON f.user_id = u.id
                WHERE f.seller_id = ?
            `
            const result = await database.executeQuery(unFollowQuery, [id]) as RowDataPacket
            return {
                data: result
            }

        } catch (error) {
            return new HttpException(400, errorMessages.FOLLOW_ERROR)
        }
    }

    public create = async (model: CreateDto) => {
        try {
            const query = `
                INSERT INTO ${this.tableName} (order_id, date, time, meridiem)
                VALUES (?, ?, ?, ?) 
            `
            const result = await database.executeQuery(query, [model.order_booking_id, model.date, model.time, model.meridiem]) as RowDataPacket
            if (result.insertId === 0) {
                return new HttpException(200, errorMessages.CREATE_FAILED)
            }
            return {
                data: result
            }
        } catch (error) {
            return new HttpException(400, errorMessages.FOLLOW_ERROR)
        }
    }
}

export default OrdersBookingDetailService