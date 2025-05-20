import errorMessages from "@core/config/constants";
import database from "@core/config/database";
import { HttpException } from "@core/exceptions";
import { RowDataPacket } from "mysql2";
import { CreateDto } from "@modules/orderDeliveryMethod";
import DeliveryNoteService from "@modules/deliveryNote/service";
import axios from "axios";
import { UpdateDto } from "@modules/product_category/dtos/update.dto";
import { checkExist } from "@core/utils/checkExist";
class OrderDeliveryMethodService {

    private tableName = 'order_delivery_method'
    private deliveryNoteService = new DeliveryNoteService()

    public create = async (model: CreateDto) => {
        try {
            let fee = 0
            if (model.method == undefined) {
                model.method = 'shop'
            }
            if (model.method === 'delivery') {
                const order_detail = await this.deliveryNoteService.findByIdExpandCombo(model.order_id!) as any
                const response = await axios.post(`${process.env.DELIVERY_URL!}/ship_services/get-ship-fee/${'viettelpost'}`, { order: order_detail.data })
                fee = response.data.data
            }
            const query = `INSERT INTO ${this.tableName} (order_id, method, shipper_id, ship_key, ship_fee, ship_fee_payer, created_at, updated_at) VALUE (?, ?, ?, ?, ?, ?, ?, ?)`
            const result = await database.executeQuery(query, [model.order_id, model.method, model.shipper_id || null, model.method === 'delivery' ? 'viettelpost' : model.ship_key || null, model.method === 'delivery' ? fee : model.ship_fee || null, model.ship_fee_payer || 'Khách trả', new Date(), new Date()]) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }
            return {
                data: result
            }
        } catch (error) {
            return new HttpException(500, errorMessages.CREATE_FAILED)
        }
    };

    public update = async (model: CreateDto) => {
        console.log(model)
        try {
            const exist = await checkExist('order_delivery_method', 'order_id', model.order_id!.toString())
            if (!exist) {
                return new HttpException(400, errorMessages.NOT_FOUND)
            }
            console.log(exist)
            let query = `update ${this.tableName} set`;
            const values = []
            const update_at = new Date()
            if (model.method) {
                query += ' method = ?,';
                values.push(model.method);
            }
            if (model.shipper_id) {
                query += ' shipper_id = ?,';
                values.push(model.shipper_id);
            }
            if (model.ship_key) {
                query += ' ship_key = ?,';
                values.push(model.ship_key);
            }
            if (model.ship_fee) {
                query += ' ship_fee = ?,';
                values.push(model.ship_fee);
            }
            if (model.ship_fee_payer) {
                query += ' ship_fee_payer = ?,';
                values.push(model.ship_fee_payer);
            }
            query += ' updated_at = ? where id = ?'
            values.push(update_at)
            values.push(exist[0].id)
            const result = await database.executeQuery(query, values) as RowDataPacket
            return {
                data: result
            }
        } catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED)
        }
    }
}

export default OrderDeliveryMethodService;
