import Notification from '@core/firebase/notification';
import { checkExist } from '@core/utils/checkExist';

export class NotificationUtil {
    public static orderNotificationToMarketing = async (order: any, adminId: number) => {
        let adminName = 'Admin';
        const checkAdmin = await checkExist('users', 'id', adminId.toString());
        if (checkAdmin == false) { } else {
            adminName = checkAdmin[0].name;
        }
        const checkToken = await checkExist('device_token', 'user_id', order.created_id.toString());
        if (checkToken == false) { } else {
            const message = {
                title: 'Yapo',
                // body: `New order from ${order.customer_name}`,
                body: `${adminName} vừa duyệt đơn hàng ${order.code} của bạn`,
                token: checkToken[0].token,
                data: {
                    order_id: order.id,
                    customer_name: order.customer_name,
                    customer_phone: order.customer_phone,
                    customer_address: order.customer_address,
                    total_price: order.total_price
                }
            }
            // return message
            const sendNotification = async () => {
                try {
                    await Notification.sendNotification(message.token, message.title, message.body, JSON.stringify(message.data));
                } catch (error) {
                }
            }
            sendNotification();
        }
    }
}