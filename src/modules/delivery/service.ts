import database from "@core/config/database";
import { HttpException } from "@core/exceptions";
import errorMessages from "@core/config/constants";
import axios from "axios";
import { CreateDto as OrderDto } from '@modules/order/dtos/create.dto'
import { RowDataPacket } from "mysql2";

class DeliveryService {


    public createOrderShip = async (order_id: number, ship_key: string) => {
        try {
            const result = await axios.post(`${process.env.DELIVERY_URL!}/ship_services/create-ordership/${ship_key}`, {
                order_id
            })
            if (result.data.errors) {
                return new HttpException(404, result.data.errors[0].message)
            }
            return {
                data: { ...result.data }
            }
        } catch (error) {
            return new HttpException(404, errorMessages.CREATE_FAILED)
        }
    }
}

export default DeliveryService;