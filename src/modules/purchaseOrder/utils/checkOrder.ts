import errorMessages from "@core/config/constants";
import { checkExist } from "@core/utils/checkExist"
import { StatusOrder } from "../interface";

export class CheckOrder {
    public static checkOrderCompletedOrCanceled = async (order_id: number) => {
        const check = await checkExist('purchase_order', 'status', order_id.toString());
        if (check instanceof Error) {
            throw check;
        }
        if (check != false && check[0].status == StatusOrder.COMPLETED || check[0].status == StatusOrder.CANCEL) {
            // return true
            if (check[0].status == StatusOrder.COMPLETED) {
                return {
                    result: true,
                    status: StatusOrder.COMPLETED,
                    message: errorMessages.ORDER_COMPLETED
                }
            } else if (check[0].status == StatusOrder.CANCEL) {
                return {
                    result: true,
                    status: StatusOrder.CANCEL,
                    message: errorMessages.ORDER_CANCELED
                }
            }
        } else
            return false;
    }
}