import database from "@core/config/database";
import { HttpException } from "@core/exceptions";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { checkExist } from "@core/utils/checkExist";
import path from "path";
import fs from "fs";
import PurchaseOrderService from "@modules/purchaseOrder/service";
import { CreateDto as PurchaseOrderDto } from "@modules/purchaseOrder/dtos/create.dto";
import { StatusOrder } from "@modules/purchaseOrder/interface";
class AdminResetService {
    private purchaseOrderService = new PurchaseOrderService();
    public resetProductBySellerId = async (seller_id: number) => {
        try {
            if (!Number.isInteger(seller_id) || seller_id <= 0) {
                return new HttpException(400, errorMessages.SELLER_NOT_FOUND);
            }
            const results = await database.executeQuery(
                `SELECT 
                    p.id AS product_id, 
                    pa.id AS product_attribute_id, 
                    pi.id AS product_image_id
                 FROM product p
                 LEFT JOIN product_attributes pa ON pa.product_parent_id = p.id
                 LEFT JOIN product_image pi ON pi.product_id = p.id
                 WHERE p.seller_id = ?;`,
                [seller_id]
            ) as RowDataPacket[];
            //console.log('results', results)
            if (results.length > 0) {
                const productIds = [...new Set(results.map(row => row.product_id))].join(',');
                const productAttributesIds = [...new Set(results.map(row => row.product_attribute_id).filter(id => id !== null))].join(',');
                const productImageIds = [...new Set(results.map(row => row.product_image_id).filter(id => id !== null))];
                //console.log('productImageIds', productImageIds)
                
                const deleteResults = await Promise.allSettled([
                    productIds.length > 0 && database.executeQuery(`DELETE FROM product_tax_config WHERE product_id IN (${productIds})`),
                    productIds.length > 0 && database.executeQuery(`DELETE FROM product_viewed WHERE product_id IN (${productIds})`),
                    productAttributesIds.length > 0 && database.executeQuery(`DELETE FROM product_attribute_detail WHERE attribute_id IN (${productAttributesIds})`),
                    productAttributesIds.length > 0 && database.executeQuery(`DELETE FROM product_attributes WHERE id IN (${productAttributesIds})`),
                    database.executeQuery(`DELETE FROM product_commission WHERE seller_id = ?`, [seller_id]),
                    this.deleteBySellerId('purchase_order_detail', seller_id),
                    this.deleteBySellerId('order_detail', seller_id),
                    this.deleteBySellerId('warehouse', seller_id),
                    this.deleteBySellerId('warehouse_history', seller_id),
                    this.deleteBySellerId('delivery_note_detail', seller_id),
                    ...productImageIds.map(record => { this.deleteInReset(record) }),
                    this.deleteBySellerId('purchase_order_status_history', seller_id),
                    this.deleteBySellerId('purchase_status_payment_history', seller_id),
                    this.deleteBySellerId('purchase_order', seller_id),
                    this.deleteBySellerId('order_status_history', seller_id),
                    this.deleteBySellerId('orders', seller_id),
                    this.deleteBySellerId('delivery_note', seller_id),
                ]);
                const failedDeletions = deleteResults.filter(result =>
                    result.status === 'rejected'
                );
                //console.log('deletionResults: ', deleteResults)
                if (failedDeletions.length > 0) {
                    console.error("Một số thao tác xóa thất bại:", failedDeletions);
                    return new HttpException(400, errorMessages.DELETE_FAILED);
                }
                await database.executeQuery(`DELETE FROM product WHERE id IN (${productIds})`)
            }

        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED);
        }
    };

    public resetOrderBySellerId = async (seller_id: number, condition: string, branchId?: number) => {
        try {
            if (!Number.isInteger(seller_id) || seller_id <= 0) {
                return new HttpException(400, errorMessages.SELLER_NOT_FOUND);
            }
            if (condition !== "all") {

                if (branchId) {
                   //console.log('branchId', branchId)
                    const orders = await database.executeQuery(`SELECT id, status FROM orders WHERE status > 3 AND seller_id = ? and branch_id = ?`, [seller_id, branchId]) as RowDataPacket[]
                    if (orders.length > 0) {
                        const orderIds = orders.map(row => row.id);
                        const placeholders = orderIds.map(() => "?").join(", ");
                        await Promise.allSettled([
                            placeholders.length > 0 && database.executeQuery(`DELETE FROM order_status_history WHERE seller_id = ? and order_id IN (${placeholders})`, [seller_id, ...orderIds]),
                            placeholders.length > 0 && database.executeQuery(`DELETE FROM order_detail WHERE seller_id = ? AND order_id IN (${placeholders})`, [seller_id, ...orderIds]),
                            database.executeQuery(`DELETE FROM orders WHERE seller_id = ? AND status > 3 AND branch_id = ?`, [seller_id, branchId])
                        ])
                    }
                    return;
                }

                const orders = await database.executeQuery(
                    `SELECT id, status FROM orders WHERE status > 3 AND seller_id = ?;`,
                    [seller_id]
                ) as RowDataPacket[];
                if (orders.length > 0) {
                    const orderIds = orders.map(row => row.id);
                    const placeholders = orderIds.map(() => "?").join(", ");
                    await Promise.allSettled([
                        placeholders.length > 0 && database.executeQuery(
                            `DELETE FROM order_status_history WHERE seller_id = ? AND order_id IN (${placeholders});`,
                            [seller_id, ...orderIds]
                        ),
                        placeholders.length > 0 && database.executeQuery(
                            `DELETE FROM order_detail WHERE seller_id = ? AND order_id IN (${placeholders});`,
                            [seller_id, ...orderIds]
                        ),
                        database.executeQuery(
                            `DELETE FROM orders WHERE seller_id = ? AND status > 3;`,
                            [seller_id]
                        )
                    ]);
                }
            } else {
                if (branchId) {
                   //console.log('branchId', branchId)
                    const orders = await database.executeQuery(`SELECT id from orders where seller_id = ? and branch_id = ?`, [seller_id, branchId]) as RowDataPacket[]
                    if (orders.length > 0) {
                        const orderIds = orders.map(row => row.id);
                        const placeholders = orderIds.map(() => "?").join(", ");
                        await Promise.allSettled([
                            placeholders.length > 0 && database.executeQuery(`DELETE FROM order_status_history WHERE seller_id = ? and order_id IN (${placeholders})`, [seller_id, ...orderIds]),
                            placeholders.length > 0 && database.executeQuery(`DELETE FROM order_detail WHERE seller_id = ? AND order_id IN (${placeholders})`, [seller_id, ...orderIds]),
                            database.executeQuery(`DELETE FROM orders WHERE seller_id = ? AND branch_id = ?`, [seller_id, branchId])
                        ])
                    }
                    return;
                }
               //console.log('all')
                let deleteResults = await Promise.allSettled([
                    this.deleteBySellerId('order_status_history', seller_id),
                    this.deleteBySellerId('order_detail', seller_id),
                    this.deleteBySellerId('orders', seller_id),
                ])
                const failedDeletions = deleteResults.filter(result =>
                    result.status === 'rejected'
                );
                //console.log('deleteResults', deleteResults)
                if (failedDeletions.length > 0) {
                    console.error("Một số thao tác xóa thất bại:", failedDeletions);
                    return new HttpException(400, errorMessages.DELETE_FAILED);
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED)
        }
    }

    public deleteBySellerId = async (tableName: string, seller_id: number) => {
        const exists = await checkExist(tableName, 'seller_id', seller_id.toString());
        if (!exists) {
            return { message: `${errorMessages.NOT_FOUND} ${tableName}` };
        }
        const result = await database.executeQuery(
            `DELETE FROM ${tableName} WHERE seller_id = ?`, [seller_id]
        );
        return {
            message: (result as any).affectedRows > 0
                ? errorMessages.DELETE_SUCCESS
                : `${errorMessages.NOT_FOUND} ${tableName}`,
            seller_id
        };
    };

    public deleteInReset = async (id: number) => {
        if (!await checkExist('product_image', 'id', id.toString()))
            return new HttpException(400, errorMessages.NOT_EXISTED);
        const query = `SELECT pi.image, p.code FROM product_image pi LEFT JOIN product p ON pi.product_id = p.id WHERE pi.id = ?`
        const imageData = await database.executeQuery(query, [id])
        const { image, code } = (imageData as any)[0]
        const result = await database.executeQuery(`delete from product_image where id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        await this.deleteImageInReset(path.resolve(__dirname, process.env.PRODUCT_UPLOAD_IMAGE_PATH + `/${code}/thumbnail`), image)
        await this.deleteImageInReset(path.resolve(__dirname, process.env.PRODUCT_UPLOAD_IMAGE_PATH + `/${code}`), image);
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: id
        }
    }

    private deleteImageInReset = async (productDir: string, fileName: string) => {
        const imagePath = path.resolve(productDir, fileName);
       //console.log(fs.existsSync(imagePath))
        try {
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                const folderContents = fs.readdirSync(productDir);
                if (folderContents.length === 0) {
                    fs.rmdirSync(productDir);
                }
            }
        } catch (error) {
            throw new HttpException(500, errorMessages.DELETE_FAILED);
        }
    }

    public resetWarehouseBySellerId = async (seller_id: number, createId: number, condition: string, branchId: number) => {
        try {
            if (!Number.isInteger(seller_id) || seller_id <= 0) {
                return new HttpException(400, errorMessages.SELLER_NOT_FOUND);
            }
            let deleteResults;
            if (condition !== "all") {
                if (!branchId) {
                    const productsResult = await database.executeQuery(`
                        select w.product_id, w.supplier_id, w.branch_id, w.quantity, p.price_import 
                        FROM warehouse w 
                        LEFT JOIN product p on p.id = w.product_id 
                        WHERE w.seller_id = ?`, [seller_id]) as RowDataPacket[]
                    if (productsResult.length === 0) {
                        return;
                    }
                    //console.log('productsResult', productsResult)
                    //xóa purchase_order
                    const productIds = productsResult.map((item: any) => item.product_id)
                    //console.log('productIds', [seller_id, ...productIds])
                    const productIdPlaceholders = productIds.map(() => '?').join(', ');
                    //console.log('productIdPlaceholders: ', productIdPlaceholders)
                    const orderResults = await database.executeQuery(`SELECT order_id FROM purchase_order_detail WHERE seller_id = ? AND product_id IN (${productIdPlaceholders})`, [seller_id, ...productIds]) as RowDataPacket[];
                    const orderIds = orderResults.map((item: any) => item.order_id)
                    //console.log('orderIds', orderIds)
                    const orderIdsPlaceholders = orderIds.length > 0 ? orderIds.map(() => '?').join(', ') : 'NULL';
                    //console.log('orderIdsPlaceholders', orderIdsPlaceholders)
                    //console.log('orderIds', orderIds)
                    deleteResults = await Promise.allSettled([
                        orderIdsPlaceholders.length > 0 && database.executeQuery(`DELETE from purchase_order_status_history where seller_id = ? AND order_id IN (${orderIdsPlaceholders})`, [seller_id, ...orderIds]),
                        orderIdsPlaceholders.length > 0 && database.executeQuery(`DELETE from purchase_status_payment_history where seller_id = ? AND order_id IN (${orderIdsPlaceholders})`, [seller_id, ...orderIds]),
                        orderIdsPlaceholders.length > 0 && database.executeQuery(`DELETE from purchase_order where seller_id = ? AND id IN (${orderIdsPlaceholders})`, [seller_id, ...orderIds]),
                        productIdPlaceholders.length > 0 && database.executeQuery(`DELETE from purchase_order_detail where seller_id = ? AND product_id IN (${productIdPlaceholders})`, [seller_id, ...productIds]),
                        this.deleteBySellerId('warehouse_history', seller_id),
                        this.deleteBySellerId('warehouse', seller_id),
                    ])
                    let order_details = []
                    let amount_paid = 0
                    if (productsResult.length > 0) {
                        for (const element of productsResult) {
                            amount_paid += Number(element.quantity) * Number(element.price_import)
                            order_details.push({
                                product_id: element.product_id,
                                quantity: Number(element.quantity),
                                price: Number(element.price_import),
                                created_id: createId,
                                discount_value: 0,
                                discount_type: 0,
                                seller_id: seller_id,
                            })
                        }
                    }
                    const response = await this.purchaseMultipleProduct(createId, seller_id, order_details, amount_paid);
                    if (response instanceof HttpException) {
                        return new HttpException(400, 'Nhập kho thất bại')
                    }
                }
                else {
                    const productsResult = await database.executeQuery(`
                        select w.product_id, w.supplier_id, w.branch_id, w.quantity, p.price_import 
                        FROM warehouse w 
                        LEFT JOIN product p on p.id = w.product_id 
                        WHERE w.seller_id = ? AND w.branch_id = ${branchId}`, [seller_id]) as RowDataPacket[]
                    if (productsResult.length === 0) {
                        return;
                    }
                    //console.log('productsResult', productsResult)
                    //xóa purchase_order
                    const productIds = productsResult.map((item: any) => item.product_id)
                    //console.log('productIds', [seller_id, ...productIds])
                    const productIdPlaceholders = productIds.map(() => '?').join(', ');
                    //console.log('productIdPlaceholders: ', productIdPlaceholders)
                    const orderResults = await database.executeQuery(`
                        SELECT pod.order_id FROM purchase_order_detail pod
                        left join purchase_order po on po.id = pod.order_id
                        WHERE pod.seller_id = ? AND po.branch_id = ${branchId} AND pod.product_id IN (${productIdPlaceholders})`, [seller_id, ...productIds]) as RowDataPacket[];
                    const orderIds = orderResults.map((item: any) => item.order_id)
                    //console.log('orderIds', orderIds)
                    const orderIdsPlaceholders = orderIds.length > 0 ? orderIds.map(() => '?').join(', ') : 'NULL';
                    //console.log('orderIdsPlaceholders', orderIdsPlaceholders)
                    //console.log('orderIds', orderIds)
                    deleteResults = await Promise.allSettled([
                        orderIdsPlaceholders.length > 0 && database.executeQuery(`DELETE from purchase_order_status_history where seller_id = ? AND order_id IN (${orderIdsPlaceholders})`, [seller_id, ...orderIds]),
                        orderIdsPlaceholders.length > 0 && database.executeQuery(`DELETE from purchase_status_payment_history where seller_id = ? AND order_id IN (${orderIdsPlaceholders})`, [seller_id, ...orderIds]),
                        orderIdsPlaceholders.length > 0 && database.executeQuery(`DELETE from purchase_order where seller_id = ? AND id IN (${orderIdsPlaceholders})`, [seller_id, ...orderIds]),
                        productIdPlaceholders.length > 0 && database.executeQuery(`DELETE from purchase_order_detail where seller_id = ? AND product_id IN (${productIdPlaceholders})`, [seller_id, ...productIds]),
                        // this.deleteBySellerId('warehouse_history', seller_id),
                        // this.deleteBySellerId('warehouse', seller_id),
                        database.executeQuery(`DELETE from warehouse_history where seller_id = ? and branch_id = ?`, [seller_id, branchId]),
                        database.executeQuery(`DELETE from warehouse where seller_id = ? and branch_id = ?`, [seller_id, branchId]),
                    ])
                    let order_details = []
                    let amount_paid = 0
                    if (productsResult.length > 0) {
                        for (const element of productsResult) {
                            amount_paid += Number(element.quantity) * Number(element.price_import)
                            order_details.push({
                                product_id: element.product_id,
                                quantity: Number(element.quantity),
                                price: Number(element.price_import),
                                created_id: createId,
                                discount_value: 0,
                                discount_type: 0,
                                seller_id: seller_id,
                            })
                        }
                    }
                    const response = await this.purchaseMultipleProduct(createId, seller_id, order_details, amount_paid, branchId);
                    if (response instanceof HttpException) {
                        return new HttpException(400, 'Nhập kho thất bại')
                    }
                }
                
            } else {
                if (branchId) {
                   //console.log('branchId', branchId)
                    const purchaseOrder = await database.executeQuery(`SELECT id from purchase_order where seller_id = ? and branch_id = ?`, [seller_id, branchId]) as RowDataPacket[];
                    if (purchaseOrder.length > 0) {
                        const purchaseOrderIds = purchaseOrder.map(row => row.id);
                        const placeholders = purchaseOrderIds.map(() => "?").join(", ");
                        await Promise.allSettled([
                            database.executeQuery(`DELETE from warehouse_history where seller_id = ? and branch_id = ?`, [seller_id, branchId]),
                            database.executeQuery(`DELETE from warehouse where seller_id = ? and branch_id = ?`, [seller_id, branchId]),
                            placeholders.length > 0 && database.executeQuery(`DELETE from purchase_order_detail where seller_id = ? and order_id IN (${placeholders})`, [seller_id, ...purchaseOrderIds]),
                            database.executeQuery(`DELETE from purchase_order_status_history where seller_id = ? and branch_id = ?`, [seller_id, branchId]),
                            placeholders.length > 0 && database.executeQuery(`DELETE from purchase_status_payment_history where seller_id = ? and order_id IN (${placeholders})`, [seller_id, ...purchaseOrderIds]),
                            database.executeQuery(`DELETE from purchase_order where seller_id = ? and branch_id = ?`, [seller_id, branchId])
                        ])
                    }
                    return;
                }
               //console.log('all')
                deleteResults = await Promise.allSettled([
                    this.deleteBySellerId('warehouse_history', seller_id),
                    this.deleteBySellerId('warehouse', seller_id),
                    database.executeQuery(`DELETE from purchase_order_detail where seller_id = ?`, [seller_id]),
                    database.executeQuery(`DELETE from purchase_order_status_history where seller_id = ?`, [seller_id]),
                    database.executeQuery(`DELETE from purchase_status_payment_history where seller_id = ?`, [seller_id]),
                    database.executeQuery(`DELETE from purchase_order where seller_id = ?`, [seller_id])
                ])
            }
            const failedDeletions = deleteResults.filter(result =>
                result.status === 'rejected'
            );
            //console.log('deletionResults: ', deleteResults)
            if (failedDeletions.length > 0) {
                console.error("Một số thao tác xóa thất bại:", failedDeletions);
                return new HttpException(400, errorMessages.DELETE_FAILED);
            }
        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED)
        }
    }
    private purchaseMultipleProduct = async (created_id: number, seller_id: number, order_list: any[], amount_paid: number, branch_id?: number) => {
        let branchId 
        if (branch_id) {
            branchId = branchId
        }
        else {
            const branchQuery = `SELECT id as branch_id from branch where seller_id = ? and is_default = 1`
            const branch = await database.executeQuery(branchQuery, [seller_id]) as RowDataPacket
            branchId = branch[0].branch_id
        }
        const purchaseOrder: PurchaseOrderDto = {
            created_id: created_id,
            supplier_id: 0,
            branch_id: branchId,
            seller_id: seller_id,
            order_status_payment_history: [
                {
                    payment_method: 'tien_mat',
                    amount_paid: amount_paid
                }
            ],
            order_status_history: [
                {
                    status: StatusOrder.CREATE_VARIANT
                },
                {
                    status: StatusOrder.IMPORT
                },
                {
                    status: StatusOrder.COMPLETED
                },
            ],
            order_details: order_list
        }
        const res = await this.purchaseOrderService.create(purchaseOrder)
        if (res instanceof HttpException) {
            return new HttpException(400, errorMessages.CREATE_FAILED)
        }

    }

}

export default AdminResetService