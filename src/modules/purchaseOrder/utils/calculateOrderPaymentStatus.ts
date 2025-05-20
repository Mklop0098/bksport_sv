import { StatusPaymentPurchase } from "../interface";

interface ICalculateOrderPaymentStatus {
    total_amount_paid?: number;
    status_payment?: string;
    debt?: number;
}
// export async function calculateOrderPaymentStatus(order: any) {
//     const resultCalc = {} as ICalculateOrderPaymentStatus;
//     const totalAmoutPaid: number = order.order_status_history.reduce((sum: number, payment: any) => {
//         return sum + payment.amount_paid;
//     })
//     if (totalAmoutPaid >= order.totalPriceAfterDiscount) {
//         resultCalc.total_amount_paid = totalAmoutPaid;
//         resultCalc.status_payment = StatusPaymentPurchase.PAID;
//         resultCalc.debt = 0;
//     } else if (totalAmoutPaid < order.totalPriceAfterDiscount) {
//         resultCalc.total_amount_paid = totalAmoutPaid;
//         resultCalc.status_payment = StatusPaymentPurchase.PARTIALLY_PAID;
//         resultCalc.debt = order.totalPriceAfterDiscount - totalAmoutPaid;
//     } else if (totalAmoutPaid == 0) {
//         resultCalc.total_amount_paid = totalAmoutPaid;
//         resultCalc.status_payment = StatusPaymentPurchase.NOT_PAYMENT;
//         resultCalc.debt = order.totalPriceAfterDiscount;
//     }
//     return resultCalc;
// }

export function calculateOrderPaymentStatus(order: any) {
    const clonedOrder = structuredClone(order);
    const resultCalc = {} as ICalculateOrderPaymentStatus;

    const total_amount_paid = clonedOrder.order_status_payment_history.reduce((sum: number, payment: any) => {
        const amountPaid = parseFloat(payment.amount_paid) || 0;
        return sum + amountPaid;
    }, 0);

    const totalPriceAfterDiscount = parseFloat(clonedOrder.totalPriceAfterDiscount) || 0;
    const debt = totalPriceAfterDiscount - total_amount_paid;

    if (total_amount_paid === 0) {
        resultCalc.total_amount_paid = total_amount_paid;
        resultCalc.status_payment = StatusPaymentPurchase.NOT_PAYMENT;
        resultCalc.debt = totalPriceAfterDiscount;
    } else if (total_amount_paid >= totalPriceAfterDiscount) {
        resultCalc.total_amount_paid = total_amount_paid;
        resultCalc.status_payment = StatusPaymentPurchase.PAID;
        resultCalc.debt = 0;
    } else {
        resultCalc.total_amount_paid = total_amount_paid;
        resultCalc.status_payment = StatusPaymentPurchase.PARTIALLY_PAID;
        resultCalc.debt = debt;
    }   

    return resultCalc;
}
