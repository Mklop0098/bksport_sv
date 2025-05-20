import { Request, Response, NextFunction } from 'express';
import Notification from '@core/firebase/notification';
import { RowDataPacket } from 'mysql2';
import database from '@core/config/database';
import NotificationService from '@modules/notification/service';
import { CreateDto as NotificationDto } from '@modules/notification';
import { CreateDto } from './dtos/create.dto';
import { sendResponse } from '@core/utils';
import errorMessages from '@core/config/constants';
class OrderMiddleware {
    public static orderNotification = async (req: Request, res: Response, next: NextFunction) => {
        const originalSend = res.send;
        res.send = function (body: any) {
            if (res.statusCode === 200) {
                let result;
                try {
                    result = JSON.parse(body);
                } catch (err) {
                    result = body;
                }
                if (result && result.data && result.data.id) {
                    const orderId = result.data.id;;
                    const code = result.data.code;
                    const created_name = result.data.created_name;
                    let totalPriceAfterDiscount = result.data.totalPriceAfterDiscount;
                    database.executeQuery(`select token from device_token where user_id = 1`).then((result) => {
                        if (result && (result as any).length == 0) return next();
                        const deviceToken = (result as RowDataPacket)[0].token;
                        if (totalPriceAfterDiscount) {totalPriceAfterDiscount = totalPriceAfterDiscount.toLocaleString('vi-VN')}
                        const amount = totalPriceAfterDiscount;
                        const message = {
                            title: 'Yapo',
                            body: `${created_name} vừa tạo đơn hàng ${code}, giá trị đơn hàng ${amount}vnđ`,
                            token: deviceToken,
                            data: { id: orderId }
                        };
                        //console.log(message);

                        const sendNotification = async () => {
                            try {
                                await Notification.sendNotification(message.token, message.title, message.body, JSON.stringify(message.data));
                            } catch (error) {
                                return next();
                            }
                        }
                        sendNotification();

                        // ghi thong bao vao bang notification
                        let model: NotificationDto = {
                            receiver_id: 1,
                            message: {
                                title: message.title,
                                body: message.body,
                            },
                            notification_type_id: 1,
                            user_id: body.user_id || 1,
                        }
                        const notificationService = new NotificationService();
                        notificationService.create(model);
                    })
                    next();
                }
            }
            return originalSend.call(this, body);
        };
        next();
    }
    public static checkPrice = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body;
        (model as RowDataPacket).order_details.forEach((detail: any) => {
            if (detail.price < 0) {
                return sendResponse(res, 400, errorMessages.PRICE_INVALID);
            }
            if (detail.quantity < 0) {
                return sendResponse(res, 400, errorMessages.QUANTITY_INVALID);
            }

            if (detail.discount_value != undefined) {
                if (detail.discount_value < 0) {
                    return sendResponse(res, 400, errorMessages.DISCOUNT_VALUE_INVALID);
                }
                if (detail.discount_type == 1 && detail.discount_value > 100) {
                    return sendResponse(res, 400, errorMessages.DISCOUNT_VALUE_INVALID);
                }
                if (detail.discount_type == 2 && detail.discount_value != undefined) {
                    if (detail.discount_value > detail.price) {
                        return sendResponse(res, 400, errorMessages.DISCOUNT_VALUE_INVALID);
                    }
                }
            }
        })
        next();
    }
}



export default OrderMiddleware;