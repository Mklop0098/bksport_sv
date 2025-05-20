import orderStatus from '@core/config/constants';
import { StatusOrder } from './interface';
import { checkExist } from '@core/utils/checkExist';
import { HttpException } from '@core/exceptions';
import errorMessages from '@core/config/constants';
import database from '@core/config/database';
import path from 'path';
import { RowDataPacket } from 'mysql2';

export const convertPushlishNumberToOrderStatus = (publishNumber: string) => {
    if (publishNumber == StatusOrder.NEW) {
        return orderStatus.PURCHASE_STATUS_CREATE;
    }
    if (publishNumber == StatusOrder.IMPORT) {
        return orderStatus.PURCHASE_STATUS_IMPORT;
    }
    if (publishNumber == StatusOrder.COMPLETED) {
        return orderStatus.PURCHASE_STATUS_COMPLETED;
    }
    if(publishNumber == StatusOrder.CANCEL){
        return orderStatus.PURCHASE_STATUS_CANCEL;
    }
    if(publishNumber == StatusOrder.APPROVE){
        return orderStatus.PURCHASE_STATUS_APPROVE;
    }
    if(publishNumber == StatusOrder.NOT_APPROVE){
        return orderStatus.PURCHASE_STATUS_NOT_APPROVE;
    }
    if(publishNumber == StatusOrder.CONFIRM){
        return orderStatus.PURCHASE_STATUS_CONFIRM;
    }
    if(publishNumber == StatusOrder.NOT_CONFIRM){
        return orderStatus.PURCHASE_STATUS_NOT_CONFIRM;
    }
}

export const convertOrderStatusPayment = (statusPayment : number) => {
    if(statusPayment === 0){
        return orderStatus.STATUS_PAYMENT_0;
    }
    if(statusPayment === 1){
        return orderStatus.STATUS_PAYMENT_1;
    }
    if(statusPayment === 2){
        return orderStatus.STATUS_PAYMENT_2;
    }
}
const convertPathOfImage = (image: string, code: string, type?: string) => {
    let userDir = ''
    if (type === 'thumbnail') {
        userDir = path.join(process.env.PRODUCT_UPLOAD_IMAGE as string, code, 'thumbnail');
    }
    else {
        userDir = path.join(process.env.PRODUCT_UPLOAD_IMAGE as string, code);
    }
    const rePath = path.join(userDir, image)
    return rePath
}

export const findById = async (id: number) => {
    let resultImage;
    let query = `select p.*, pt.id as product_type_id, pt.name as product_type_name, b.id as brand_id, b.name as brand_name, pu.name as unit_name, group_concat(pi.image) as images 
    from product p 
    left join product_type pt on p.product_type_id = pt.id 
    left join brand b on p.brand_id = b.id 
    left join product_image pi on pi.product_id = p.id 
    left join product_unit pu on p.unit_id = pu.id  
    where p.id = ? 
    group by p.id, pt.id, b.id`;
    const check = await checkExist('product', 'id', id.toString());
    if (check == false)
        return new HttpException(404, errorMessages.NOT_EXISTED + 'produc1t');
    const result = await database.executeQuery(query, [id]);
    if (Array.isArray(result) && result.length === 0)
        return new HttpException(404, errorMessages.NOT_EXISTED + 'product');
    let queryImage = `select * from product_image where product_id = ?`
    resultImage = await database.executeQuery(queryImage, [id]);
    if (Array.isArray(resultImage) && resultImage.length === 0) {
        // return new HttpException(404, errorMessages.NOT_EXISTED + 'image');
    }
    if (Array.isArray(result) && result.length > 0 && Array.isArray(resultImage) && resultImage.length > 0) {
        for (let i = 0; i < result.length; i++) {
            (resultImage as any)[i].image_thumbnail = convertPathOfImage((resultImage as any)[i].image, (result as any)[i].code, 'thumbnail');
            (resultImage as any)[i].image = convertPathOfImage((resultImage as any)[i].image, (result as any)[i].code);
            (result as any)[i].images = resultImage;
        }
    }
    return {
        data: {
            ...(result as RowDataPacket[])[0],
        }
    }
}