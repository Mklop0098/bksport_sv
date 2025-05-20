// import { checkExist } from "@core/utils/checkExist"

// export class CheckOrder {
//     public static checkOrderCompletedOrCanceled = async (order_id: number) => {
//         const check = await checkExist('orders', 'status', order_id.toString());
//         if (check instanceof Error) {
//             throw check;
//         }
//         if (check != false && check[0].status == 5 || check[0].status == 6) {
//             return true;
//         } else
//             return false;
//     }
// }


import errorMessages from "@core/config/constants";
import { checkExist } from "@core/utils/checkExist"

export class CheckOrder {
    public static checkOrderCompletedOrCanceled = async (order_id: number) => {
        const check = await checkExist('orders', 'status', order_id.toString());
        if (check instanceof Error) {
            throw check;
        }
        if (check != false && check[0].status == 5 || check[0].status == 6) {
            // return true
            if (check[0].status == 5) {
                return {
                    result: true,
                    status: 5,
                    message: errorMessages.ORDER_COMPLETED
                }
            } else if (check[0].status == 6) {
                return {
                    result: true,
                    status: 6,
                    message: errorMessages.ORDER_CANCELED
                }
            }
        } else
            return false;
    }
}