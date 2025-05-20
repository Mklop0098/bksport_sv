import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar, generateCodeWithSeller } from "@core/utils/gennerate.code";
import { convertPushlishNumberToOrderStatus, convertOrderStatusPayment, checkInventory, CheckInventory, CheckOrderQuantity, getDeliveryDetail, updateStatusOrderDelivery } from "./utils";
import _ from 'lodash';
import OrderDetailService from "@modules/orderDetail/service";
import ProductService from "@modules/product/product.service";
import OrderStatusService from "@modules/orderStatusHistory/service";
import { CreateDto as OrderStatus } from "@modules/orderStatusHistory";
import DeliveryNoteService from "@modules/deliveryNote/service";
import { CreateDto as DeliveryNote } from "@modules/deliveryNote/dtos/create.dto";
import Ilog from "@core/interfaces/log.interface";
import { convertNumberToVND } from "@core/utils/convertNumberToVND";
import { ICalculateOrder, IReportStatus } from "./interface";
import ProductCommissionService from "@modules/productCommission/service";
import { calculateTotalPriceAfterDiscount } from "@core/utils/calcTotalPriceAfterDiscount";
import { NotificationUtil } from "./utils/notification";
import { Time } from "@core/utils/time";
import { CheckOrder } from "./utils/checkOrder";
import { RevenueCalc } from "./utils/revenueCalc";
import WarehouseService from "@modules/warehouse/service";
import BranchService from "@modules/branch/service";
import ProductComboDetailService from "@modules/productComboDetail/service";
import OrderDeliveryMethodService from "@modules/orderDeliveryMethod/service";
import axios from "axios";
class OrderService {
    private tableName = 'orders';
    private tableCustomer = 'customers'
    private fieldId = 'id'
    private moduleId = 3

    private orderDetailService = new OrderDetailService()
    private productService = new ProductService()
    private orderStatusService = new OrderStatusService()
    private deliveryNoteService = new DeliveryNoteService()
    private productCommissionService = new ProductCommissionService()
    private branchService = new BranchService()
    private warehouseService = new WarehouseService()
    private productComboDetailService = new ProductComboDetailService()
    private orderDeliveryMethodService = new OrderDeliveryMethodService()

    public create = async (model: CreateDto) => {
        if (!model.branch_id) {
            const employee_branch = await database.executeQuery(`SELECT branch_id FROM employee_branch WHERE user_id = ?`, [model.created_id]) as RowDataPacket
            if (employee_branch.length > 0 && !employee_branch.map((item: any) => item.branch_id).includes(0)) {
                model.branch_id = employee_branch[0].branch_id
            } else {
                const branchQuery = `SELECT id as branch_id from branch where seller_id = ? and is_default = 1`
                const branch = await database.executeQuery(branchQuery, [model.seller_id]) as RowDataPacket
                model.branch_id = branch[0].branch_id
            }
        }
        let errors: any[] = []
        const combo_details: CheckOrderQuantity[] = []
        if (model.order_details) {
            const product_map: CheckInventory[] = []
            for (const item of model.order_details) {
                if (item.type !== 'combo') {
                    const product = product_map.find(product => product.product_id === item.product_id)
                    if (product) {
                        product.quantity += item.quantity || 0
                    } else {
                        const available = await this.warehouseService.getAvailableQuantity(item.product_id!, [model.branch_id!], model.seller_id!)
                        product_map.push({
                            product_id: item.product_id!,
                            quantity: item.quantity!,
                            available: Number(available.data),
                        })
                    }
                } else {
                    const combo_detail = await this.productComboDetailService.getByComboId(item.product_id!) as any
                    for (const detail of combo_detail.data) {
                        const product = product_map.find(product => product.product_id === detail.product_id)
                        const product_combo = combo_details.find(product => product.product_id === detail.product_id)
                        if (product_combo) {
                            product_combo.quantity += detail.quantity * item.quantity! || 0
                        } else {
                            combo_details.push({
                                product_id: detail.product_id!,
                                quantity: detail.quantity! * item.quantity!,
                                price: detail.price,
                                combo_id: detail.combo_id!,
                                discount_type: detail.discount_type!,
                                discount_value: detail.discount_value!,
                                price_combo: detail.price_combo!,
                            })
                        }
                        if (product) {
                            product.quantity += detail.quantity * item.quantity! || 0
                        } else {
                            const available = await this.warehouseService.getAvailableQuantity(detail.product_id!, [model.branch_id!], model.seller_id!)
                            product_map.push({
                                product_id: detail.product_id!,
                                quantity: detail.quantity! * item.quantity!,
                                available: Number(available.data),
                            })
                        }
                    }
                }
            }
            const product_id_not_enough = product_map.filter((item: any) => item.available < item.quantity).map(item => item.product_id)
            for (const item of model.order_details) {
                if (item.type !== 'combo' && product_id_not_enough.includes(item.product_id!)) {
                    const product_code = await checkExist('product', 'id', item.product_id!.toString()) as any
                    errors.push({
                        product_id: item.product_id,
                        error: `${product_code[0].code} - Số lượng sản phẩm trong kho không đủ`
                    })
                }
                else if (item.type === 'combo') {
                    const combo_detail = await this.productComboDetailService.getByComboId(item.product_id!) as any
                    const error = {
                        product_id: item.product_id,
                        error: ""
                    }
                    let error_message = []
                    for (const detail of combo_detail.data) {
                        if (product_id_not_enough.includes(detail.product_id!)) {
                            const product_code = await checkExist('product', 'id', detail.product_id!.toString()) as any
                            error_message.push(`${product_code[0].code}`)
                        }
                    }
                    if (error_message.length > 0) {
                        error.error = error_message.join(', ') + " - Số lượng sản phẩm trong kho không đủ"
                        errors.push(error)
                    }
                }
            }
        }
        if (errors.length > 0) {
            return {
                data: {
                    status: 400,
                    errors
                }
            }
        }
        let orderDetail = model.order_details
        if (model.order_details && model.order_details.length <= 0)
            return new HttpException(400, errorMessages.NOT_EXISTED, 'order_details');
        const check = await checkExist(this.tableCustomer, 'id', model.customer_id!.toString())
        if (check == false)
            return new HttpException(400, errorMessages.NOT_EXISTED, 'customer_id');
        const checkPrice = await this.checkPrice(model);
        if (checkPrice !== undefined && (checkPrice as RowDataPacket) instanceof Error) {
            return new HttpException(400, (checkPrice as RowDataPacket).message, (checkPrice as RowDataPacket).field);
        }
        let code = ""
        if (model.seller_id == 1) {
            code = await generateCodePrefixChar(this.tableName, 'Y', 7) as string
        } else {
            code = await generateCodeWithSeller(this.tableName, 'Y', 8, model.seller_id as number) as string
        }
        let checkUser;
        const create_at = new Date()
        let query = `insert into ${this.tableName}`;
        const values = []
        let fields = ''
        let params = ''
        if (code != undefined) {
            fields += 'code,'
            params += '?,'
            values.push(code)
        }
        if (model.created_id != undefined) {
            fields += 'created_id,'
            params += '?,'
            values.push(model.created_id)
            checkUser = await checkExist('users', 'id', model.created_id.toString())
        }
        if (model.customer_id != undefined) {
            fields += 'customer_id,'
            params += '?,'
            values.push(model.customer_id)
        }
        if (model.city_id != undefined) {
            fields += 'city_id,'
            params += '?,'
            values.push(model.city_id)
        }
        if (model.district_id != undefined) {
            fields += 'district_id,'
            params += '?,'
            values.push(model.district_id)
        }
        if (model.ward_id != undefined) {
            fields += 'ward_id,'
            params += '?,'
            values.push(model.ward_id)
        }
        if (model.address != undefined) {
            fields += 'address,'
            params += '?,'
            values.push(model.address)
        }
        if (model.name != undefined) {
            fields += 'name,'
            params += '?,'
            values.push(model.name)
        }
        if (model.phone != undefined) {
            fields += 'phone,'
            params += '?,'
            values.push(model.phone)
        } else {
            return new HttpException(400, errorMessages.PHONE_REQUIRED, 'phone');
        }
        if (model.des != undefined) {
            fields += 'des,'
            params += '?,'
            values.push(model.des)
        }
        if (model.branch_id != undefined) {
            fields += 'branch_id,'
            params += '?,'
            values.push(model.branch_id)
        }
        if (model.seller_id != undefined) {
            fields += 'seller_id,'
            params += '?,'
            values.push(model.seller_id || 0)
        }
        fields += 'status,'
        params += '?,'
        values.push(1)
        fields += 'created_at,'
        params += '?,'
        values.push(create_at)
        fields = fields.slice(0, -1)
        params = params.slice(0, -1)
        query += ` (${fields}) values (${params})`

        let log: Ilog = {
            user_id: model.created_id!,
            module_id: this.moduleId,
            action: errorMessages.CREATE,
        }
        const result = await database.executeQueryLog(query, values, log);
        //console.log("result", result);

        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED);
        //orderDetail
        let order_id = (result as any).insertId
        let resultOrderDetail = null
        let orderDetailResult: any = []
        if (orderDetail) {
            for (let element of orderDetail) {

                const regex = /^(0|[1-9]\d*(\.\d+)?|\.\d+)$/;
                if (!regex.test((element as RowDataPacket).price)) {
                    return new HttpException(400, errorMessages.PRICE_MUST_GREATER_THAN_ZERO, 'price');
                }
                const price_wholesale = element.price_wholesale ? element.price_wholesale : null;
                resultOrderDetail = await this.orderDetailService.create({
                    order_id: order_id,
                    product_id: element.product_id,
                    quantity: element.quantity,
                    price: element.price,
                    price_wholesale,
                    created_id: model.created_id,
                    discount_value: element.discount_value || 0,
                    discount_type: element.discount_type || 0,
                    price_type: element.price_type || 0,
                    seller_id: model.seller_id || 0
                })
                orderDetailResult.push((resultOrderDetail as any).data)
            }
        }

        if (combo_details.length > 0) {
            for (const element of combo_details) {
                const regex = /^(0|[1-9]\d*(\.\d+)?|\.\d+)$/;
                if (!regex.test((element as RowDataPacket).price)) {
                    return new HttpException(400, errorMessages.PRICE_MUST_GREATER_THAN_ZERO, 'price');
                }
                resultOrderDetail = await this.orderDetailService.create({
                    order_id: order_id,
                    product_id: element.product_id,
                    quantity: element.quantity,
                    price: element.price,
                    price_wholesale: element.price_combo,
                    created_id: model.created_id,
                    combo_id: element.combo_id,
                    discount_value: element.discount_value || 0,
                    discount_type: element.discount_type || 0,
                    seller_id: model.seller_id || 0
                })
                orderDetailResult.push((resultOrderDetail as any).data)
            }
        }
        //orderStatus
        let resultOrderStatus: OrderStatus = {
            order_id: order_id,
            status: 1,
            user_id: model.created_id,
            seller_id: model.seller_id
        }
        await this.orderStatusService.create(resultOrderStatus);
        const totalPriceAfterDiscount = (model.order_details != undefined && model.order_details.length > 0) ? calculateTotalPriceAfterDiscount(model.order_details) : 0;
        console.log({
            order_id: order_id,
            method: model.delivery_method,
            shipper_id: model.shipper_id,
            ship_key: model.ship_key,
            ship_fee: model.ship_fee,
            ship_fee_payer: model.ship_fee_payer
        });
        await this.orderDeliveryMethodService.create({
            order_id: order_id,
            method: model.delivery_method,
            shipper_id: model.shipper_id,
            ship_key: model.ship_key,
            ship_fee: model.ship_fee,
            ship_fee_payer: model.ship_fee_payer
        })

        return {
            data: {
                id: order_id,
                code: code,
                ...model,
                order_detail: (orderDetailResult as any),
                status: 1,
                status_name: convertPushlishNumberToOrderStatus(1),
                created_id: model.created_id,
                created_at: create_at,
                totalPrice: this.calculateTotalPrice(model),
                totalPriceAfterDiscount: totalPriceAfterDiscount,
                created_name: ((checkUser as RowDataPacket)[0].name != undefined) ? (checkUser as RowDataPacket)[0].name : null,
            }
        }

    }
    public delete = async (id: number) => {
        if (!await checkExist(this.tableName, this.fieldId, id.toString()))
            return new HttpException(400, errorMessages.EXISTED);
        const result = await database.executeQuery(`delete from ${this.tableName} where id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: id
        }
    }

    public findById = async (id: number) => {
        // Get order with joins
        let query = `
            SELECT 
                b.name,
                o.*,
                ct.name as city_name,
                s.name as seller_name,
                s.phone as seller_phone,
                s.email as seller_email,
                dt.name as district_name,
                o.status,
                wd.name as ward_name,
                GROUP_CONCAT(
                    DISTINCT 
                    JSON_OBJECT(
                        'id', odm.id,
                        'order_id', odm.order_id,
                        'method', odm.method,
                        'shipper_id', odm.shipper_id,
                        'ship_key', odm.ship_key,
                        'ship_fee', odm.ship_fee,
                        'ship_fee_payer', odm.ship_fee_payer
                    )
                ) AS delivery_method
            FROM ${this.tableName} o 
            LEFT JOIN branch b ON b.id = o.branch_id
            LEFT JOIN seller s ON s.id = o.seller_id
            LEFT JOIN city ct ON ct.id = o.city_id  
            LEFT JOIN district dt ON dt.id = o.district_id 
            LEFT JOIN ward wd ON wd.id = o.ward_id
            LEFT JOIN order_delivery_method odm ON odm.order_id = o.id
            WHERE o.id = ?`;

        const resultOrder = await database.executeQuery(query, [id]) as RowDataPacket;
        if (!resultOrder?.length) {
            return new HttpException(404, errorMessages.NOT_FOUND);
        }

        const order = resultOrder[0];

        // Get order details and branch in parallel
        const [orderDetail, branch] = await Promise.all([
            this.orderDetailService.findAllOrderDetailByOrderId(id, true),
            this.branchService.findById(order.branch_id)
        ]);

        order.order_detail = (orderDetail as any).data;
        order.branch = (branch as any).data;

        // Process order details
        await Promise.all(order.order_detail.map(async (detail: any) => {
            const product = await this.productService.findByIdUpdate(detail.product_id);
            if (product instanceof Error) return;

            const productData = product.data;
            detail.commission = productData.commission;
            detail.code = productData.code;
            detail.name = productData.name;
            detail.weight = productData.weight

            if (productData.images?.length) {
                detail.image_thumbnail = productData.images[0].image_thumbnail;
            }

            if (productData.type === 'combo') {
                const comboDetail = await this.orderDetailService.findOrderDetailByOrderIdAndComboId(order.id, productData.id) as any;
                detail.combo_detail = comboDetail.data;
                detail.type = 'combo';
            } else {
                detail.type = 'normal';
                const available = await this.warehouseService.getAvailableQuantity(
                    detail.product_id, order.branch_id, order.seller_id
                );
                detail.available = Number(available.data) || 0;
            }

            // Calculate prices
            const calcPrice: ICalculateOrder = {
                price: detail.price,
                quantity: detail.quantity,
                discount_value: detail.discount_value,
                discount_type: detail.discount_type,
                price_type: detail.price_type,
                price_wholesale: detail.price_wholesale
            };

            detail.discount_type_name = this.convertDiscountTypeToName(detail.discount_type);
            detail.totalPrice = this.calcTotalPrice(calcPrice).totalPrice;
        }));

        // Calculate totals
        const total = order.order_detail.reduce((sum: number, item: any) => sum + Number(item.totalPrice), 0);
        order.totalPrice = total;
        order.paid = order.status_payment == 1 ? total : 0;
        order.debt = order.status_payment == 1 ? 0 : total;

        // Get order status info
        const [orderStatus, statusId] = await Promise.all([
            this.orderStatusService.findAllStatusByOrderId(order.id),
            this.orderStatusService.findAllOrderStatusByOrderId(order.id)
        ]);

        if (!(orderStatus instanceof Error)) {
            Object.assign(order, orderStatus.data);
        }

        order.status = order.status;
        order.status_name = convertPushlishNumberToOrderStatus(order.status);
        order.status_payment_name = convertOrderStatusPayment(order.status_payment);
        order.pay_method_name = this.convertPaymentMethod(order.pay_method);
        order.ship_method_name = this.convertShipMethod(order.ship_method);

        // Get creator info
        if (order.created_id) {
            const creator = await checkExist('users', 'id', order.created_id.toString());
            if (creator?.[0]) {
                order.created_name = `${creator[0].name} ${creator[0].phone}`;
                order.employee_name = creator[0].name;
            }
        }

        const deliveryDetail = await getDeliveryDetail(order.id)
        if (!(deliveryDetail instanceof Error)) {
            order.delivery_detail = deliveryDetail.data
        }

        return { data: { ...order, delivery_method: JSON.parse(order.delivery_method) } };
    }
    public findByIdUpdate = async (id: number) => {
        const result = await checkExist(this.tableName, this.fieldId, id.toString());
        if (result == false)
            return new HttpException(400, errorMessages.NOT_EXISTED, 'id');
    }

    public updatePublish = async (id: number, publish: number) => {
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(400, errorMessages.NOT_FOUND, 'id');
        // if (publish == 5 && check[0].publish == 4 || check[0].publish == 5)
        //     return new HttpException(400, errorMessages.ORDER_STATUS_NOT_ALLOW, 'publish');
        let query = `update ${this.tableName} set publish = ? `
        if (publish && publish.toString().length > 0 && publish == 1) {
            query += `, created_at = ?`
        }
        if (publish && publish.toString().length > 0 && publish == 2) {
            query += `, processing_at = ?`
        }
        if (publish && publish.toString().length > 0 && publish == 3) {
            query += `, delivering_at = ?`
        }
        if (publish && publish.toString().length > 0 && publish == 4 && check[0].publish !== 5) {
            query += `, completed_at = ?`
        }
        if (publish && publish.toString().length > 0 && publish == 5 && check[0].publish !== 4) {
            query += `, canceled_at = ?`
        }
        query += ` where id = ?`
        const time = new Date()

        try {
            const result = await database.executeQuery(query, [publish, time, id]);
            if ((result as any).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            return {
                data: {
                    id: id,
                    publish: publish,
                    publish_name: convertPushlishNumberToOrderStatus(publish),
                    updated_at: time
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public deleteRows = async (data: number[]) => {
        let query = `delete from ${this.tableName} where id in (${data})`
        const result = await database.executeQuery(query);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS
        }
    }
    public update = async (id: number, model: CreateDto) => {
        //console.log(model.branch_id, !model.branch_id)
        if (!model.branch_id) {
            const branch = await database.executeQuery(`select branch_id from orders where id = ${id}`) as RowDataPacket
            if (branch.length > 0) {
                model.branch_id = branch[0].branch_id
            }
            else {
                let branchDefault = await database.executeQuery(`select id from branch where online_selling = 1 and seller_id = ${model.seller_id}`) as RowDataPacket
                if (branchDefault.length < 1) {
                    branchDefault = await database.executeQuery(`select id from branch where is_default = 1 and seller_id = ${model.seller_id}`) as RowDataPacket
                }
                model.branch_id = branchDefault[0].id
            }
        }
        //console.log(model.branch_id)
        let check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(400, errorMessages.NOT_FOUND, 'id');
        if (model.status == 5 && check[0].status == 4 || check[0].status == 5)
            return new HttpException(400, errorMessages.ORDER_STATUS_NOT_ALLOW, 'status');
        let query = `update ${this.tableName} set`;
        const values = []
        if (model.pay_method != undefined) {
            query += ' pay_method = ?,'
            values.push(model.pay_method)
        }
        if (model.ship_method != undefined) {
            query += ' ship_method = ?,'
            values.push(model.ship_method)
        }
        if (model.des != undefined) {
            query += ' des = ?,'
            values.push(model.des)
        }
        if (model.status && (model.status == true || model.status == 5)) {
            let resultStatus;
            let check = await this.orderStatusService.findAllOrderStatusByOrderId(id)
            if (Array.isArray((check as RowDataPacket).data) && (check as RowDataPacket).data.length > 0 && ((check as RowDataPacket).data[0].status == 4 || (check as RowDataPacket).data[0].status == 5)) {
                return new HttpException(400, errorMessages.ORDER_STATUS_NOT_ALLOW, 'status');
            }
            if (model.status == 5) {
                resultStatus = await this.orderStatusService.updateOrderStatus(id, model.created_id as number, 5)
            } else {
                resultStatus = await this.orderStatusService.updateOrderStatus(id, model.created_id as number)
            }
            if (resultStatus instanceof Error) {
                return new HttpException(400, errorMessages.UPDATE_STATUS_FAILED, 'status');
            }
            else {
                query += ' status = ?,'
                values.push((resultStatus as RowDataPacket).data.status)
                const checkOrder = await this.orderDetailService.findAllOrderDetailByOrderId(id)
                if ((resultStatus as RowDataPacket).data.status == 4) {
                    let deliveModel: DeliveryNote = {
                        created_id: model.created_id,
                        delivery_note_detail: [],
                        seller_id: model.seller_id,
                        branch_id: model.branch_id,
                        type: "xuat_kho_ban_le",
                        status: "hoan_thanh",
                        export_at: new Date(),
                        order_id: id
                    }
                    const orderMap = (checkOrder as any).data.map((item: any) => { item.qty = item.quantity; return item })
                    deliveModel.delivery_note_detail = orderMap;
                    //console.log('update', deliveModel)
                    const resultDeliveryNote = await this.deliveryNoteService.create(deliveModel)
                    if (resultDeliveryNote instanceof Error) {
                        return new HttpException(400, errorMessages.CREATE_FAILED, 'delivery_note');
                    }
                }
            }
        }
        const update_at = new Date()
        query += `  updated_at = ? where id = ?`
        values.push(update_at)
        values.push(id)
        const result = await database.executeQuery(query, values);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        return {
            data: {
                id: id,
                ...model,
                // publish_name,
                updated_at: update_at,
                created_at: check[0].created_at,
                processing_at: check[0].processing_at,
                delivering_at: check[0].delivering_at,
                completed_at: check[0].completed_at,
                canceled_at: check[0].canceled_at
            }
        }
    }

    public report = async (fromDate: string, toDate: string, date: string, created_id: number, seller_id: number, role_id: number) => {
        if (date != undefined && fromDate == undefined && toDate == undefined) {
            fromDate = date + ' 00:00:00'
            toDate = date + ' 23:59:59'
        }

        if (fromDate != undefined && toDate != undefined) {
            fromDate = Time.addTimeIfMissing(fromDate, '00:00:00');
            toDate = Time.addTimeIfMissing(toDate, '23:59:59');
        }
        // them admin thi duoc xem tat ca
        let query = `
            select 
            os.status, 
            count(distinct os.id) as total_orders, 
            os.created_id as created_id 
            from orders os 
            where 1 = 1 
        `;
        // if (created_id != 1) {
        //     query = `select os.status, count(distinct os.order_id) as total_orders, o.created_id as created_id from ${this.tableOrderStatus} os left join orders o on o.id = os.order_id  where os.created_at between ? and ? and created_id = ${created_id} group by os.status order by os.status asc`;
        // } else if (created_id == 1) {
        //     query = `select os.status, count(distinct os.order_id) as total_orders from ${this.tableOrderStatus} os left join orders o on o.id = os.order_id  where os.created_at between ? and ? group by os.status order by os.status asc`;
        // }
        let values: any = [];
        if (date !== undefined || (fromDate !== undefined && toDate !== undefined)) {
            query += ' and os.created_at between ? and ? '
            values.push(fromDate)
            values.push(toDate)
        }

        if (created_id !== undefined && created_id != 1 && role_id) {
            if (role_id === 1 || role_id === 3) {
            }
            else {
                const queryCheck = `
                                    SELECT p.id as module_name FROM permission p
                                    left join module_detail md on md.id = p.module_detail_id
                                    left join module m on m.id = md.module_id
                                    where p.role_id = ? and md.action = 'index-all' and m.url = 'customers'
                                `
                const checkRole = await database.executeQuery(queryCheck, [role_id]) as RowDataPacket

                if (checkRole.length === 0) {
                    query += ' and os.created_id = ? '
                    values.push(created_id)
                }
            }
        }

        query += 'and os.seller_id = ? group by os.status order by os.status asc'
        values.push(seller_id)

        const result = await database.executeQuery(query, values) as RowDataPacket
        ////console.log(result.filter((i: any) => i.status === 1)[0])
        return {
            data: [
                {
                    status: 1,
                    total_orders: result.filter((i: any) => i.status === 1)[0]?.total_orders || 0
                },
                {
                    status: 2,
                    total_orders: result.filter((i: any) => i.status === 2)[0]?.total_orders || 0
                },
                {
                    status: 3,
                    total_orders: result.filter((i: any) => i.status === 3)[0]?.total_orders || 0
                },
                {
                    status: 4,
                    total_orders: result.filter((i: any) => i.status === 4)[0]?.total_orders || 0
                },
                {
                    status: 5,
                    total_orders: result.filter((i: any) => i.status === 5)[0]?.total_orders || 0
                },
                {
                    status: 6,
                    total_orders: result.filter((i: any) => i.status === 6)[0]?.total_orders || 0
                },
            ]
        }
    }

    public reportOrderByFomDateToDate = async (fromDate: string, toDate: string, status: number) => {
        let query = `select o.*, os.status as latest_status, os.created_at as status_date from orders o join (select order_id, status, created_at, row_number() over (partition by order_id order by created_at desc) as rn from order_status_history where created_at between ? and ?) os on o.id = os.order_id where os.rn = 1`;
        const values = [fromDate, toDate];
        const result = await database.executeQuery(query, values);
        if (Array.isArray(result) && result.length === 0) {
            return new HttpException(404, errorMessages.NOT_FOUND);
        }
        return {
            data: result
        }
    }
    private convertPaymentMethod = (paymentMethod: number) => {
        switch (paymentMethod) {
            case 1:
                return errorMessages.PAYMENT_METHOD_1;
            case 2:
                return errorMessages.PAYMENT_METHOD_2;
            case 3:
                return errorMessages.PAYMENT_METHOD_3;
            default:
                return errorMessages.PAY_METHOD_NOT_EXISTED
        }
    }
    private convertShipMethod = (shipMethod: number) => {
        switch (shipMethod) {
            case 1:
                return errorMessages.SHIP_METHOD_1;
            case 2:
                return errorMessages.SHIP_METHOD_2;
            default:
                return errorMessages.SHIP_METHOD_NOT_EXISTED
        }
    }
    private calculateTotalPrice = (order: CreateDto): number => {
        let totalPrice = 0;
        (order as RowDataPacket).order_details.forEach((detail: any) => {
            const price = detail.price
            const itemTotal = price * detail.quantity;
            totalPrice += itemTotal;
        });

        return totalPrice;
    }
    public reportSaleInvoice = async (id: number, seller_id: number) => {
        let query = `select o.* , ct.name as city_name, dt.name as district_name, wd.name as ward_name from ${this.tableName} o left join city ct on ct.id = o.city_id  left join district dt on dt.id = o.district_id left join ward wd on wd.id = o.ward_id where o.id = ?`;
        const values = [id];
        const resultOrder = await database.executeQuery(query, values);
        if (Array.isArray(resultOrder) && resultOrder.length === 0) {
            return new HttpException(404, errorMessages.NOT_FOUND);
        }
        const orderDetail = await this.orderDetailService.findAllOrderDetailByOrderId(id);
        const result = (resultOrder as any);
        (result).forEach(async (element: any) => {
            element.order_detail = (orderDetail as any).data
        })
        for (let i = 0; i < (result as any).length; i++) {
            for (let j = 0; j < (result as any)[i].order_detail.length; j++) {
                const product = await this.productService.findById((result as any)[i].order_detail[j].product_id)
                if (product instanceof Error) {
                } else {
                    let productCode;
                    if (product != undefined && !(product instanceof Error)) {
                        productCode = (product as any).data.code;
                    }
                    let images; let name;
                    if ((product as any).data.images != null && (product as any).data.images.length > 0) {
                        images = (product as any).data.images;
                    }
                    name = (product as any).data.name;
                    (result as any)[i].order_detail[j].code = productCode;
                    result[i].order_detail[j].name = name;
                    if ((product as any).data.images != null && (product as any).data.images.length > 0) {
                        result[i].order_detail[j].image_thumbnail = images[0].image_thumbnail;
                    }
                }
                //     result[i].order_detail[j].totalPrice = (result as any)[i].order_detail[j].quantity * (result as any)[i].order_detail[j].price
                //     result[i].order_detail[j].discount = 0; //khong dung nua
                //     result[i].order_detail[j].discount_price = result[i].order_detail[j].totalPrice; //khong dung nua

                // }
                // const total = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalPrice, 0)
                // result[i].totalPrice = total
                // const calcPrice: ICalculateOrder = {
                //     price: (result as any)[i].order_detail[j].price,
                //     quantity: (result as any)[i].order_detail[j].quantity,
                //     discount_value: (result as any)[i].order_detail[j].discount_value,
                //     discount_type: (result as any)[i].order_detail[j].discount_type
                // };
                const calcPrice: ICalculateOrder = {
                    price: (result as any)[i].order_detail[j].price,
                    quantity: (result as any)[i].order_detail[j].quantity,
                    discount_value: (result as any)[i].order_detail[j].discount_value,
                    discount_type: (result as any)[i].order_detail[j].discount_type,
                    price_type: (result as any)[i].order_detail[j].price_type,
                    price_wholesale: (result as any)[i].order_detail[j].price_wholesale

                };
                // result[i].order_detail[j].discount_type_name = this.convertDiscountTypeToName((result as any)[i].order_detail[j].discount_type);
                // const totalPrice = this.calcTotalPrice(calcPrice)
                // result[i].order_detail[j].totalPrice = totalPrice;
                result[i].order_detail[j].discount_type_name = this.convertDiscountTypeToName((result as any)[i].order_detail[j].discount_type);
                const calcValue = this.calcTotalPrice(calcPrice);
                result[i].order_detail[j].totalPrice = calcValue.totalPrice;
                result[i].order_detail[j].totalPriceAfterDiscount = calcValue.totalPriceAfterDiscount;

            }
            const total = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalPrice, 0)
            result[i].totalPrice = total
            const resultOrderStatus = await this.orderStatusService.findAllStatusByOrderId((result as any)[i].id)
            const resultStatusId = await this.orderStatusService.findAllOrderStatusByOrderId((result as any)[i].id)
            const statusId = (resultStatusId as any).data[0].status
            result[i].status = statusId
            result[i].status_name = convertPushlishNumberToOrderStatus(statusId);
            (result as any)[i].pay_method_name = this.convertPaymentMethod((result as any)[i].pay_method);
            (result as any)[i].ship_method_name = this.convertShipMethod((result as any)[i].ship_method);

            if (!(resultOrderStatus instanceof Error)) {
                result[i] = { ...result[i], ...(resultOrderStatus as any).data }
            }
            const checkUserCreate = await checkExist('users', 'id', (result as any)[i].created_id.toString())
            if (checkUserCreate && checkUserCreate[0] != undefined) {
                result[i].created_name = checkUserCreate[0].name + ' ' + checkUserCreate[0].phone
            }
            // (result as any)[i].discount = 0; //khong dung nua da check
            // (result as any)[i].discount_price = result[i].totalPrice; //khong dung nua
            // result[i].total_price_name = convertNumberToVND(result[i].totalPrice)
            const totalPriceAfterDiscount = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalPriceAfterDiscount, 0)
            result[i].totalPriceAfterDiscount = totalPriceAfterDiscount;
            result[i].total_price_after_discount_name = convertNumberToVND(totalPriceAfterDiscount)
        }
        return {
            data: (result as any)[0]
        }
    }
    // cap nhat status va xuat list hoa don
    public updateListStatus = async (listId: number[], status: number, created_id: number, seller_id: number) => {
        const listResponse = []
        console.log(listId, status, created_id, seller_id)
        if (status == 2) {
            const productIds = listId
            const orderDetails = await Promise.all(productIds.map(id => this.findById(id)));

            for (let i = 0; i < listId.length; i++) {
                const product = listId[i];
                const order_detail = (orderDetails[i] as any).data.order_detail;

                for (const item of order_detail) {
                    const different_product_combo_detail = new Set();
                    if (item.type === 'combo') {
                        const current_product_combo_detail = await database.executeQuery(`
                            SELECT product_id, quantity, price_combo as price FROM product_combo_detail WHERE combo_id = ?
                        `, [item.product_id]) as RowDataPacket[];

                        const current_map = new Map(current_product_combo_detail.map(e => [e.product_id, e]));
                        const combo_map = new Map(item.combo_detail.map((e: any) => [e.product_id, e]));

                        for (const [id, element] of combo_map.entries()) {
                            const current = current_map.get(id);
                            if (!current || current.quantity * item.quantity != (element as { quantity: number; price: number }).quantity || current.price * item.quantity != (element as { quantity: number; price: number }).price) {
                                different_product_combo_detail.add(id);
                            }
                        }
                        for (const [id] of current_map) {
                            if (!combo_map.has(id)) {
                                different_product_combo_detail.add(id);
                            }
                        }
                    }
                    if (different_product_combo_detail.size > 0) {
                        return new HttpException(400, 'Thông tin sản phẩm đã thay đổi, vui lòng kiểm tra lại');
                    }
                }
            }
        }

        for (let i = 0; i < listId.length; i++) {
            const checkList = await checkExist(this.tableName, 'id', listId[i].toString());
            if (checkList == false) {
                return new HttpException(404, errorMessages.NOT_FOUND, 'id');
            } else {
                let statusCurrent = (checkList as RowDataPacket)[0].status
                console.log(statusCurrent, status)
                if (statusCurrent + 1 != status && status != 6) {
                    if (status == 7 && statusCurrent == 3) {
                        break
                    }
                    else if (status == 4 && statusCurrent == 7) {
                        break
                    }
                    else {
                        return new HttpException(400, errorMessages.INVALID_LIST_STATUS_UPDATE);
                    }
                }
            }
        }
        for (let i = 0; i < listId.length; i++) {
            const resultUpdateStatus = await this.updateStatusUpdate(listId[i], { status: status, created_id: created_id, seller_id: seller_id }) // status 4 xuat kho
            if (resultUpdateStatus instanceof Error) {
                return new HttpException(400, errorMessages.UPDATE_STATUS_FAILED, 'status');
            }
            if ((resultUpdateStatus as RowDataPacket).data != undefined) {
                listResponse.push((resultUpdateStatus as RowDataPacket).data)
            }

        }
        return {
            data: []
        }
    }
    public exportListPDFInvoice = async (listId: number[], seller_id: number) => {
        let listInvoice = []
        for (let i = 0; i < listId.length; i++) {
            const result = await this.reportSaleInvoice(listId[i], seller_id)
            if (result instanceof Error) {
                return new HttpException(400, errorMessages.NOT_FOUND, 'id');
            }
            listInvoice.push((result as RowDataPacket).data)
        }
        return {
            data: listInvoice
        }
    }
    public updateStatus = async (id: number, model: CreateDto) => {
        if (!model.branch_id) {
            let branchDefault = await database.executeQuery(`select id from branch where online_selling = 1 and seller_id = ${model.seller_id}`) as RowDataPacket
            if (branchDefault.length < 1) {
                branchDefault = await database.executeQuery(`select id from branch where is_default = 1 and seller_id = ${model.seller_id}`) as RowDataPacket
            }
            model.branch_id = branchDefault[0].id
        }
        //console.log(' model.branch_id', model.branch_id)
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(400, errorMessages.NOT_FOUND, 'id');
        let query = `update ${this.tableName} set status = ? where id = ?`
        const result = await database.executeQuery(query, [model.status, id]);
        const updateOrderStatus = await this.orderStatusService.updateOrderStatusByStatus(id, model.created_id as number, model.status as number)
        const checkOrder = await this.orderDetailService.findAllOrderDetailByOrderId(id)
        if (model.status == 4) {
            let deliveModel: DeliveryNote = {
                created_id: model.created_id,
                delivery_note_detail: [],
                seller_id: model.seller_id,
                branch_id: model.branch_id,
                type: "xuat_kho_ban_le",
                status: "hoan_thanh",
                export_at: new Date(),
                order_id: id
            }
            const orderMap = (checkOrder as any).data.map((item: any) => { item.qty = item.quantity; return item })
            deliveModel.delivery_note_detail = orderMap;
            deliveModel.created_id = model.created_id
            deliveModel.seller_id = model.seller_id
            //console.log('updateStatus', deliveModel)
            const resultDeliveryNote = await this.deliveryNoteService.create(deliveModel)
            if (resultDeliveryNote instanceof Error) {
                return new HttpException(400, errorMessages.CREATE_FAILED, 'delivery_note');
            }
        }
        //log
        database.log({
            user_id: model.created_id!,
            module_id: this.moduleId,
            action: errorMessages.UPDATE,
            des: { id: id, status: model.status }
        })
        return {
            data: {
                id: id,
                status: model.status,
                status_name: convertPushlishNumberToOrderStatus(model.status as number),
                updated_at: new Date()
            }
        }
    }
    public updateStatusUpdate = async (id: number, model: CreateDto) => {
        if (!model.branch_id) {
            const branch = await database.executeQuery(`select branch_id from orders where id = ${id}`) as RowDataPacket
            if (branch.length > 0) {
                model.branch_id = branch[0].branch_id
            }
            else {
                let branchDefault = await database.executeQuery(`select id from branch where online_selling = 1 and seller_id = ${model.seller_id}`) as RowDataPacket
                if (branchDefault.length < 1) {
                    branchDefault = await database.executeQuery(`select id from branch where is_default = 1 and seller_id = ${model.seller_id}`) as RowDataPacket
                }
                model.branch_id = branchDefault[0].id
            }
        }

        //console.log(' model.branch_id', model.branch_id)
        const checkList = await checkExist(this.tableName, 'id', id.toString());
        // if ((checkExist as RowDataPacket)[0].status != ) {
        if (checkList == false) {
        } else if (model.status != undefined) {
            let statusCurrent = (checkList as RowDataPacket)[0].status
            if (statusCurrent + 1 != model.status && model.status != 6) {
                if (model.status == 7 && statusCurrent == 3) {
                }
                else if (model.status == 4 && statusCurrent == 7) {
                }
                else {
                    return new HttpException(400, errorMessages.INVALID_LIST_STATUS_UPDATE);
                }
            }
        }
        let check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(400, errorMessages.NOT_FOUND, 'id');
        let query = `update ${this.tableName} set`;
        const values = []
        if (model.pay_method != undefined) {
            query += ' pay_method = ?,'
            values.push(model.pay_method)
        }
        if (model.ship_method != undefined) {
            query += ' ship_method = ?,'
            values.push(model.ship_method)
        }
        if (model.des != undefined) {
            query += ' des = ?,'
            values.push(model.des)
        }
        if (model.status_payment != undefined) {
            query += ' status_payment = ?,'
            values.push(model.status_payment)
        }
        let resultStatus;
        let checkStatus = await this.orderStatusService.findAllOrderStatusByOrderId(id)
        const satusPayment = check[0].status_payment
        if (model.status != undefined) {
            console.log((checkStatus as RowDataPacket).data[0].status, satusPayment, model.status)
            if ((checkStatus as RowDataPacket).data[0].status == 5 || (checkStatus as RowDataPacket).data[0].status == 6 || (checkStatus as RowDataPacket).data[0].status > 7) {
                return new HttpException(400, errorMessages.ORDER_STATUS_NOT_ALLOW, 'status');
            }
            if (((checkStatus as RowDataPacket).data[0].status == 4 && (satusPayment == 0 || satusPayment == null || satusPayment == 2 && model.status == 5)) && model.status != 6) {
                return new HttpException(400, errorMessages.ORDER_STASTUS_NOT_PAYMENT, 'status_payment');
            }
            resultStatus = await this.orderStatusService.updateOrderStatusUpdate(id, model.created_id as number, model.status as number, model.seller_id as number)
            if (resultStatus instanceof Error) {
                return new HttpException(400, errorMessages.UPDATE_STATUS_FAILED, 'status');
            }
            else {
            
                const delivery_method = await database.executeQuery(`select method from order_delivery_method where order_id = ${id}`) as RowDataPacket
                console.log(model.status, delivery_method)
                if (model.status == 5) {
                    if (delivery_method.length > 0 && delivery_method[0].method == 'shipper') {
                        await updateStatusOrderDelivery(id, 'da_giao_hang')
                    }
                }
        
                if (delivery_method.length > 0) {
                    query += ' status = ?,'
                    values.push(delivery_method[0].method == 'shop' && (resultStatus as RowDataPacket).data.status == 7 ? 4 : (resultStatus as RowDataPacket).data.status)
                    if (delivery_method[0].method == 'shop' && (resultStatus as RowDataPacket).data.status == 7) {
                        await this.orderStatusService.updateOrderStatusUpdate(id, model.created_id as number, 4, model.seller_id as number)
                    }
                }
                else {
                    query += ' status = ?,'
                    values.push((resultStatus as RowDataPacket).data.status)
                }
                const checkOrder = await this.orderDetailService.findAllOrderDetailByOrderId(id)
                if ((resultStatus as RowDataPacket).data.status == 7) { // trang thai 4 xuat kho => tao phieu xuat kho
                    const delivery_method = await database.executeQuery(`select method from order_delivery_method where order_id = ${id}`) as RowDataPacket
                    let deliveModel: DeliveryNote = {
                        created_id: model.created_id,
                        delivery_note_detail: [],
                        seller_id: check[0].seller_id,
                        branch_id: checkList[0].branch_id,
                        type: "xuat_kho_ban_le",
                        status: delivery_method[0].method == 'shop' ? "hoan_thanh" : "da_xuat_kho",
                        export_at: new Date(),
                        order_id: id,
                        delivery_type: delivery_method[0].method == 'delivery' ? 'xuat_kho_van_chuyen' : delivery_method[0].method == 'shipper' ? 'xuat_kho_tu_giao' : 'nhan_tai_cua_hang'
                    }
                    const orderMap = (checkOrder as any).data.map((item: any) => { item.qty = item.quantity; return item })
                    deliveModel.delivery_note_detail = orderMap;
                    //console.log('updateStatusUpdate', deliveModel, model.branch_id)
                    const resultDeliveryNote = await this.deliveryNoteService.create(deliveModel);
                    if (resultDeliveryNote instanceof Error) {
                        return new HttpException(400, errorMessages.CREATE_FAILED, 'delivery_note');
                    }
                }
                if (model.status == 2) {
                    //admin duyet don goi thong bao den tiep thi 
                    NotificationUtil.orderNotificationToMarketing((check as RowDataPacket)[0], model.created_id as number)
                }
            }
        }
        const update_at = new Date()
        query += `  updated_at = ? where id = ?`
        values.push(update_at)
        values.push(id)
        const result = await database.executeQuery(query, values);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);

        const actionTime = await database.executeQuery(`select created_at, status from order_status_history where order_id = ${id}`) as RowDataPacket
        let created_at, packing_at, processing_at, delivering_at, completed_at, canceled_at;
        if (actionTime.length > 0) {
            const createdTime = actionTime.find((item: any) => item.status === 1)?.created_at;
            if (createdTime) {
                created_at = createdTime;
            }
            const packingTime = actionTime.find((item: any) => item.status === 2)?.created_at;
            if (packingTime) {
                packing_at = packingTime;
            }
            const processingTime = actionTime.find((item: any) => item.status === 3)?.created_at;
            if (processingTime) {
                processing_at = processingTime;
            }
            const deliveringTime = actionTime.find((item: any) => item.status === 4)?.created_at;
            if (deliveringTime) {
                delivering_at = deliveringTime;
            }
            const completedTime = actionTime.find((item: any) => item.status === 5)?.created_at;
            if (completedTime) {
                completed_at = completedTime;
            }   
            const canceledTime = actionTime.find((item: any) => item.status === 6)?.created_at; 
            if (canceledTime) {
                canceled_at = canceledTime;
            }
        }
        return {
            data: {
                id: id,
                ...model,
                updated_at: update_at,
                created_at: created_at,
                packing_at: packing_at,
                processing_at: processing_at,
                delivering_at: delivering_at,
                completed_at: completed_at,
                canceled_at: canceled_at,
            }
        }
    }
    public reportDelivery = async (key: string, name: string, phone: string, page: number, limit: number, created_id: number, fromDate: string, toDate: string, status: number, date: string, listId: number[], status_payment: number, isFilter: boolean, employee_id: number, seller_id: number) => {
        //console.log('okkk');

        const getAllOrder = await this.searchs(key, name, phone, page, limit, created_id, fromDate, toDate, status, date, status_payment, isFilter, employee_id, undefined, seller_id);
        //console.log(key, name, phone, page, limit, created_id, fromDate, toDate, status, date, status_payment, isFilter, employee_id, undefined, seller_id)
        if (getAllOrder instanceof Error) {
            return new HttpException(400, errorMessages.NOT_FOUND);
        }
        let listOrder = getAllOrder.data as any[]
        if (listId != undefined && listId.length > 0) {
            const listFilter = (getAllOrder as RowDataPacket).data.filter((item: any) => listId.includes(item.id))
            listOrder = listFilter
            if (listOrder.length == 0) {
                return new HttpException(400, errorMessages.NOT_FOUND);
            }
        }

        // const filterDelivery = listOrder.filter((item: any) => item.status == 4)
        // const productReport = filterDelivery.reduce((report: any, order: any) => {
        const productReport = listOrder.reduce((report: any, order: any) => {
            order.order_detail.forEach((detail: any) => {
                const productId = detail.product_id;
                if (!report[productId]) {
                    report[productId] = {
                        id: productId,
                        name: detail.name,
                        unit_id: detail.unit_id,
                        unit_name: detail.unit_name,
                        total_quantity: 0,
                        total_price: 0
                    };
                }
                report[productId].total_quantity += detail.quantity;
                // report[productId].total_price += detail.totalPrice;
            });
            return report;
        }, {});

        const resultProduct = Object.values(productReport)
        //console.log(resultProduct);
        // phan trang result Product
        if (page && page > 0 && limit > 0) {
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const resultProductPagination = resultProduct.slice(startIndex, endIndex);
            let pagination: IPagiantion = {
                page: page,
                limit: limit,
                totalPage: Math.ceil(resultProduct.length / limit)
            }
            const data = {
                data: (resultProductPagination as RowDataPacket),
                pagination: pagination
            }
            return {
                data
            }
        }
        return {
            data: {
                data: resultProduct
            }
        }
    }
    public updateOrder = async (id: number, model: CreateDto) => {
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(400, errorMessages.NOT_FOUND, 'id');
        if (check[0].status > 1) {
            return new HttpException(400, errorMessages.ORDER_APPROVE_NOT_UPDATE, 'status');
        }
        const checkStatus = await CheckOrder.checkOrderCompletedOrCanceled(check[0].status);
        if ((checkStatus as RowDataPacket).result == true && (checkStatus as RowDataPacket).status == 5) {
            return new HttpException(400, errorMessages.ORDER_COMPLETED, 'status');
        }
        if ((checkStatus as RowDataPacket).result == true && (checkStatus as RowDataPacket).status == 6) {
            return new HttpException(400, errorMessages.ORDER_CANCELED, 'status');
        }
        let errors: any[] = []
        const combo_details: CheckOrderQuantity[] = []
        if (model.order_details) {
            const product_map: CheckInventory[] = []
            for (const item of model.order_details) {
                if (item.type !== 'combo') {
                    const product = product_map.find(product => product.product_id === item.product_id)
                    if (product) {
                        product.quantity += item.quantity || 0
                    } else {
                        const available = await this.warehouseService.getAvailableQuantity(item.product_id!, [model.branch_id!], model.seller_id!)
                        product_map.push({
                            product_id: item.product_id!,
                            quantity: item.quantity!,
                            available: Number(available.data),
                        })
                    }
                } else {
                    const combo_detail = await this.productComboDetailService.getByComboId(item.product_id!) as any
                    for (const detail of combo_detail.data) {
                        const product = product_map.find(product => product.product_id === detail.product_id)
                        const product_combo = combo_details.find(product => product.product_id === detail.product_id && product.combo_id === item.product_id)
                        if (product_combo) {
                            product_combo.quantity += detail.quantity * item.quantity! || 0
                        } else {
                            console.log('detail', {
                                product_id: detail.product_id!,
                                quantity: detail.quantity! * item.quantity!,
                                price: detail.price,
                                combo_id: item.product_id!,
                                discount_type: detail.discount_type!,
                                discount_value: detail.discount_value!,
                                price_combo: detail.price_combo!,
                            })
                            combo_details.push({
                                product_id: detail.product_id!,
                                quantity: detail.quantity! * item.quantity!,
                                price: detail.price,
                                combo_id: item.product_id!,
                                discount_type: detail.discount_type!,
                                discount_value: detail.discount_value!,
                                price_combo: detail.price_combo!,
                            })
                        }
                        if (product) {
                            product.quantity += detail.quantity * item.quantity! || 0
                        } else {
                            const available = await this.warehouseService.getAvailableQuantity(detail.product_id!, [model.branch_id!], model.seller_id!)
                            product_map.push({
                                product_id: detail.product_id!,
                                quantity: detail.quantity! * item.quantity!,
                                available: Number(available.data),
                            })
                        }
                    }
                }
            }
            const product_id_not_enough = product_map.filter((item: any) => item.available < item.quantity).map(item => item.product_id)
            for (const item of model.order_details) {
                if (item.type !== 'combo' && product_id_not_enough.includes(item.product_id!)) {
                    const product_code = await checkExist('product', 'id', item.product_id!.toString()) as any
                    errors.push({
                        product_id: item.product_id,
                        error: `${product_code[0].code} - Số lượng sản phẩm trong kho không đủ`
                    })
                }
                else if (item.type === 'combo') {
                    const combo_detail = await this.productComboDetailService.getByComboId(item.product_id!) as any
                    const error = {
                        product_id: item.product_id,
                        error: ""
                    }
                    let error_message = []
                    for (const detail of combo_detail.data) {
                        if (product_id_not_enough.includes(detail.product_id!)) {
                            const product_code = await checkExist('product', 'id', detail.product_id!.toString()) as any
                            error_message.push(`${product_code[0].code}`)
                        }
                    }
                    if (error_message.length > 0) {
                        error.error = error_message.join(', ') + " - Số lượng sản phẩm trong kho không đủ"
                        errors.push(error)
                    }
                }
            }
        }
        if (errors.length > 0) {
            return {
                data: {
                    status: 400,
                    errors
                }
            }
        }

        let query = `update ${this.tableName} set`;
        const values = []
        if (model.name != undefined) {
            query += ' name = ?,'
            values.push(model.name)
        }
        if (model.phone != undefined) {
            query += ' phone = ?,'
            values.push(model.phone)
        }
        if (model.customer_id != undefined) {
            query += ' customer_id = ?,'
            values.push(model.customer_id)
        }
        if (model.city_id != undefined) {
            query += ' city_id = ?,'
            values.push(model.city_id)
        }
        if (model.district_id != undefined) {
            query += ' district_id = ?,'
            values.push(model.district_id)
        }
        if (model.ward_id != undefined) {
            query += ' ward_id = ?,'
            values.push(model.ward_id)
        }
        if (model.address != undefined) {
            query += ' address = ?,'
            values.push(model.address)
        }
        if (model.des != undefined) {
            query += ' des = ?,'
            values.push(model.des)
        }
        if (model.pay_method != undefined) {
            query += ' pay_method = ?,'
            values.push(model.pay_method)
        }
        if (model.ship_method != undefined) {
            query += ' ship_method = ?,'
            values.push(model.ship_method)
        }
        if (model.seller_id != undefined) {
            query += ' seller_id = ?,'
            values.push(model.seller_id)
        }
        if (model.order_details != undefined) {
            //console.log(model.order_details);
            const findAllOrderDetailByOrderId = await this.orderDetailService.findAllOrderDetailByOrderId(id) as any
            if (findAllOrderDetailByOrderId.data.length > 0) {
                for (let i = 0; i < (findAllOrderDetailByOrderId as any).data.length; i++) {
                    const result = await this.orderDetailService.delete((findAllOrderDetailByOrderId as any).data[i].id)
                    if (result instanceof Error) {
                        return new HttpException(400, errorMessages.DELETE_FAILED, 'order_detail');
                    }
                }
            }
            if (model.order_details.length > 0) {
                for (let element of model.order_details) {

                    const regex = /^(0|[1-9]\d*(\.\d+)?|\.\d+)$/;
                    if (!regex.test((element as RowDataPacket).price)) {
                        return new HttpException(400, errorMessages.PRICE_MUST_GREATER_THAN_ZERO, 'price');
                    }
                    const price_wholesale = element.price_wholesale ? element.price_wholesale : null;

                    await this.orderDetailService.create({
                        order_id: id,
                        product_id: element.product_id,
                        quantity: element.quantity,
                        price: element.price,
                        price_wholesale,
                        created_id: model.created_id,
                        discount_value: element.discount_value || 0,
                        discount_type: element.discount_type || 0,
                        price_type: element.price_type || 0,
                        seller_id: model.seller_id || 0
                    })
                }
            }

            if (combo_details.length > 0) {
                for (const element of combo_details) {
                    const regex = /^(0|[1-9]\d*(\.\d+)?|\.\d+)$/;
                    if (!regex.test((element as RowDataPacket).price)) {
                        return new HttpException(400, errorMessages.PRICE_MUST_GREATER_THAN_ZERO, 'price');
                    }
                    await this.orderDetailService.create({
                        order_id: id,
                        product_id: element.product_id,
                        quantity: element.quantity,
                        price: element.price,
                        price_wholesale: element.price_combo,
                        created_id: model.created_id,
                        combo_id: element.combo_id,
                        discount_value: element.discount_value || 0,
                        discount_type: element.discount_type || 0,
                        seller_id: model.seller_id || 0
                    })
                }
            }
        }
        query += ` updated_at = ? where id = ?`
        const update_at = new Date()
        values.push(update_at)
        values.push(id)
        const result = await database.executeQuery(query, values);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        //console.log("model", model)
        return {
            data: {
                id: id,
                ...model,
                // order_details: model.order_details ? model.order_details?.map((i: any) => {return {...i, image_thumbnail: i.product_image !== '' ? i.product_image.split('/uploads').pop() : ''}}) : [],
                updated_at: update_at
            }
        }

    }

    public checkOrderQuantity = async (id: number, order_details: any[]) => {
        //console.log(id, order_details)
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(400, errorMessages.NOT_FOUND, 'id');
        const checkStatus = await CheckOrder.checkOrderCompletedOrCanceled(check[0].status);
        if ((checkStatus as RowDataPacket).result == true && (checkStatus as RowDataPacket).status == 5) {
            return new HttpException(400, errorMessages.ORDER_COMPLETED, 'status');
        }
        if ((checkStatus as RowDataPacket).result == true && (checkStatus as RowDataPacket).status == 6) {
            return new HttpException(400, errorMessages.ORDER_CANCELED, 'status');
        }
        let errors = []
        if (order_details != undefined) {
            for (const element of order_details) {
                const available = await this.warehouseService.getAvailableQuantity(element.product_id!, [element.branch_id!], element.seller_id!) as any
                if (available.data < element.quantity!) {
                    errors.push({
                        product_id: element.product_id,
                        error: `Số lượng sản phẩm trong kho không đủ - có thể mua: ${available.data}`
                    })
                }
            }
        }
        if (errors.length > 0) {
            return {
                data: {
                    status: 400,
                    errors
                }
            }
        }
    }

    public updateListStatusPayment = async (listId: number[], statusPayment: number) => {
        const listResponse = []
        for (let i = 0; i < listId.length; i++) {
            const resultUpdateStatus = await this.updateStatusUpdate(listId[i], { status_payment: statusPayment, created_id: 1 })
            if (resultUpdateStatus instanceof Error) {
                return new HttpException(400, errorMessages.UPDATE_STATUS_FAILED, 'status');
            }
            if ((resultUpdateStatus as RowDataPacket).data != undefined) {
                listResponse.push((resultUpdateStatus as RowDataPacket).data)
            }
        }
        return {
            data: listResponse
        }
    }
    private calcTotalPrice = (model: ICalculateOrder) => {
        let totalPrice = 0;
        let totalPriceAfterDiscount = 0;
        let totalDiscount = 0;
        const price = model.price_type == 1 ? model.price : (model.price_type == 2 ? model.price_wholesale : model.price)
        const { quantity, discount_type, discount_value } = model;

        if (price && quantity) {
            totalPrice = price * quantity
        }

        if (discount_type == 1 && price && quantity && discount_value) {
            totalDiscount = totalPrice * discount_value / 100;
            totalPriceAfterDiscount = totalPrice - totalDiscount;
        } else if (discount_type == 2 && price && quantity && discount_value) {
            totalDiscount = discount_value;
            totalPriceAfterDiscount = totalPrice - discount_value
        } else if (quantity && price && discount_type == 0) {
            totalPriceAfterDiscount = price * quantity;
            totalDiscount = 0;
        }
        return {
            totalPrice,
            totalPriceAfterDiscount,
            totalDiscount,
        };
    }


    private convertDiscountTypeToName = (discount_type: number) => {
        switch (discount_type) {
            case 0:
                return errorMessages.DISCOUNT_TYPE_0;
            case 1:
                return errorMessages.DISCOUNT_TYPE_1;
            case 2:
                return errorMessages.DISCOUNT_TYPE_2;
            default:
                return errorMessages.DISCOUNT_TYPE_NOT_EXISTED;
        }
    }
    public findAllCommission = async (key: string, name: string, phone: string, page: number, limit: number, created_id: number, fromDate: string, toDate: string, status: number, date: string, status_payment: number, isFilter: boolean, employee_id: number) => {
        //status = 5: đã hoàn thành
        const getAllOrder = await this.searchs(key, name, phone, page, limit, created_id, fromDate, toDate, 5, date, status_payment, isFilter, employee_id);
        if (getAllOrder instanceof Error) {
            return new HttpException(400, errorMessages.NOT_FOUND);
        }
        const groupCreatedId = this.groupCreatedId((getAllOrder as RowDataPacket).data);
        let resultList: any[] = [];
        for (const created_id of Object.keys(groupCreatedId)) {
            const orders = groupCreatedId[created_id];
            let commissionList: any[] = [];
            let totalCommission = 0;
            for (let i = 0; i < orders.length; i++) {
                const order = orders[i]

                for (let j = 0; j < order.order_detail.length; j++) {
                    const detail = order.order_detail[j];

                    let commissionValue = 0;
                    try {
                        const resultProductCommission = await this.productCommissionService.findByProductId(detail.product_id);

                        if (!(resultProductCommission instanceof Error)) {
                            commissionValue = Number.parseFloat((resultProductCommission as any).data.commission);
                        }
                    } catch (error) {
                        //console.log("error", error);
                    }

                    //console.log("commissionValue", commissionValue);
                    const totalPrice = detail.totalPrice;
                    const totalPriceAfterDiscount = detail.totalPriceAfterDiscount;
                    const commissionPercentage = commissionValue;
                    const commissionAmount = (totalPriceAfterDiscount * (commissionValue / 100)).toFixed(2);

                    const commissionData = {
                        created_at: order.created_at,
                        code: order.code,
                        product_id: detail.product_id,
                        product_name: detail.name,
                        unit_name: detail.unit_name,
                        quantity: detail.quantity,
                        price: detail.price,
                        totalPrice: totalPrice,
                        discount_type: detail.discount_type,
                        discount_value: detail.discount_value,
                        totalPriceAfterDiscount: totalPriceAfterDiscount,
                        commission_percentage: commissionPercentage,
                        commission_amount: commissionAmount,
                    };

                    //console.log("commissionData", commissionData);
                    commissionList.push(commissionData);
                    totalCommission += parseFloat(commissionAmount);
                }
            }

            resultList.push({
                fromDate: fromDate,
                toDate: toDate,
                created_id: created_id,
                created_name: orders[0].created_name,
                totalCommission: totalCommission,
                commission: commissionList
            })
        }
        return {
            data: resultList
        };
    };

    private groupCreatedId = (orders: any[]) => {
        const groupData = orders.reduce((result: any, item: any) => {
            const { created_id } = item;
            if (!result[created_id]) {
                result[created_id] = [];
            }
            result[created_id].push(item);
            return result;

        }, {})
        return groupData;
    }
    public findAllByCreatedId = async (key: string, name: string, phone: string, page: number | undefined, limit: number | undefined, created_id: number, fromDate: string, toDate: string, status: number, date: string, role_id?: number) => {
        if (date !== undefined && fromDate == undefined && toDate == undefined) {
            fromDate = date + ' 00:00:00'
            toDate = date + ' 23:59:59'
        }
        if (fromDate != undefined && toDate != undefined) {
            fromDate = Time.addTimeIfMissing(fromDate, '00:00:00');
            toDate = Time.addTimeIfMissing(toDate, '23:59:59');
        }
        // let query = ` select o.* , ct.name as city_name, dt.name as district_name, wd.name as ward_name from orders o join ( select order_id, status, created_at, row_number() over (partition by order_id order by created_at desc) as rn from order_status_history ) os on o.id = os.order_id left join city ct on ct.id = o.city_id left join district dt on dt.id = o.district_id left join ward wd on wd.id = o.ward_id  where 1=1 and ((o.created_at >= ? and o.created_at <= ?) or (o.updated_at >= ? and o.updated_at <= ?) ) and os.rn = 1 and 1=1 `;
        // let query = ` select o.* , ct.name as city_name, dt.name as district_name, wd.name as ward_name from orders o join ( select order_id, status, created_at, row_number() over (partition by order_id order by created_at desc) as rn from order_status_history ) os on o.id = os.order_id left join city ct on ct.id = o.city_id left join district dt on dt.id = o.district_id left join ward wd on wd.id = o.ward_id  where 1=1 and o.updated_at >= ? and o.updated_at <= ? and os.rn = 1 and 1=1 `;
        let query = ` select o.*, ct.name as city_name, dt.name as district_name, wd.name as ward_name, os.completed_date from orders o  join ( select order_id, created_at as completed_date, row_number() over (partition by order_id order by created_at desc) as rn from order_status_history where status = 5 ) os on o.id = os.order_id left join city ct on ct.id = o.city_id left join district dt on dt.id = o.district_id left join ward wd on wd.id = o.ward_id where 1=1  and os.rn = 1 ${fromDate && toDate ? 'and os.completed_date >= ? and os.completed_date <= ?' : ''} and 1=1 `;
        const queryParams: any[] = [];
        if (fromDate !== undefined && toDate !== undefined) {
            queryParams.push(fromDate);
            queryParams.push(toDate);
        }
        if (key != undefined) {
            query += ` and ( o.code like ? or o.name like ? or o.phone like ? or o.address like ? ) `;
            queryParams.push(`%${key}%`, `%${key}%`, `%${key}%`, `%${key}%`);
        }
        if (created_id !== undefined) {
            query += ` and o.created_id = ?`;
            queryParams.push(created_id);
        }
        if (status != undefined) {
            query += ` and o.status = ?`;
            queryParams.push(status);
        }
        if (phone != undefined) {
            query += ` and o.phone like ?`;
            queryParams.push(`%${phone}%`);
        }
        if (name != undefined) {
            query += ` and o.name like ?`;
            queryParams.push(`%${name}%`);
        }

        query += ` order by o.id desc`;
        const count = await database.executeQuery(query, queryParams);
        if (page && page < 1 || page && limit! < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (page && limit)
            query = query + ` LIMIT ` + limit + ` OFFSET ` + (page - 1) * limit;
        try {
            const result = await database.executeQuery(query, queryParams);
            if (Array.isArray(result) && result.length === 0) {
                return new HttpException(400, errorMessages.NOT_FOUND);
            }
            const totalPages = Math.ceil((count as any).length / limit!);
            for (let i = 0; i < (result as any).length; i++) {
                const orderDetail = await this.orderDetailService.findAllOrderDetailByOrderId((result as any)[i].id);
                (result as any)[i].order_detail = (orderDetail as any).data;
                for (let j = 0; j < (result as any)[i].order_detail.length; j++) {
                    const product = await this.productService.findById((result as any)[i].order_detail[j].product_id);
                    if (!(product instanceof Error)) {
                        const images = (product as any).data.images || null;
                        const name = (product as any).data.name;
                        const productCode = (product as any).data.code;
                        (result as any)[i].order_detail[j].name = name;
                        (result as any)[i].order_detail[j].code = productCode;
                        (result as any)[i].order_detail[j].image_thumbnail = images ? images[0].image_thumbnail : null;
                    }
                    // const calcPrice: ICalculateOrder = {
                    //     price: (result as any)[i].order_detail[j].price,
                    //     quantity: (result as any)[i].order_detail[j].quantity,
                    //     discount_value: (result as any)[i].order_detail[j].discount_value,
                    //     discount_type: (result as any)[i].order_detail[j].discount_type
                    // };
                    const calcPrice: ICalculateOrder = {
                        price: (result as any)[i].order_detail[j].price,
                        quantity: (result as any)[i].order_detail[j].quantity,
                        discount_value: (result as any)[i].order_detail[j].discount_value,
                        discount_type: (result as any)[i].order_detail[j].discount_type,
                        price_type: (result as any)[i].order_detail[j].price_type,
                        price_wholesale: (result as any)[i].order_detail[j].price_wholesale

                    };
                    (result as RowDataPacket)[i].order_detail[j].discount_type_name = this.convertDiscountTypeToName((result as any)[i].order_detail[j].discount_type);
                    const calcValue = this.calcTotalPrice(calcPrice);
                    (result as any)[i].order_detail[j].totalPrice = calcValue.totalPrice;
                    (result as any)[i].order_detail[j].totalPriceAfterDiscount = calcValue.totalPriceAfterDiscount;
                    // const totalPrice = this.calcTotalPrice(calcPrice);
                    // (result as any)[i].order_detail[j].totalPrice = totalPrice;
                    // const total = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalPrice, 0)
                    // result[i].totalPrice = total
                    const resultStatusId = await this.orderStatusService.findAllOrderStatusByOrderId((result as any)[i].id);
                    const statusId = (resultStatusId as any).data[0].status;
                    (result as RowDataPacket)[i].status = statusId;
                    (result as RowDataPacket)[i].status_name = convertPushlishNumberToOrderStatus(statusId);
                    // status payment name
                    (result as RowDataPacket)[i].status_payment_name = convertOrderStatusPayment((result as RowDataPacket)[i].status_payment);

                    (result as any)[i].pay_method_name = this.convertPaymentMethod((result as any)[i].pay_method);
                    (result as any)[i].ship_method_name = this.convertShipMethod((result as any)[i].ship_method);
                }
                const resultOrderStatus = await this.orderStatusService.findAllStatusByOrderId((result as any)[i].id);
                if (!(resultOrderStatus instanceof Error)) {
                    (result as RowDataPacket)[i] = { ...(result as RowDataPacket)[i], ...(resultOrderStatus as any).data };
                }
                if ((result as any)[i].created_id && (result as any)[i].created_id != undefined) { // them check exist
                    const checkUserCreate = await checkExist('users', 'id', (result as any)[i].created_id.toString())
                    if (checkUserCreate && checkUserCreate[0] != undefined) {
                        (result as any)[i].created_name = checkUserCreate[0].name + ' ' + checkUserCreate[0].phone
                    }
                }
                const total = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalPrice, 0);
                (result as any)[i].totalPrice = total;
            }
            const pagination: IPagiantion = {
                page: page,
                limit: limit,
                totalPage: totalPages
            };

            return {
                data: result,
                pagination: pagination
            };

        } catch (error) {
            return new HttpException(500, errorMessages.FAILED);
        }
    }
    public findAllCommissionByCreatedId = async (key: string, name: string, phone: string, page: number, limit: number, created_id: number, fromDate: string, toDate: string, status: number, date: string, role_id: number, user_id: number) => {
        const pageDefault = undefined;
        const limitDefaul = undefined;
        // if(!fromDate || !toDate) {}
        // status = 5: đã hoàn thành
        if (created_id !== undefined && created_id != 1 && role_id) {
            if (role_id === 1 || role_id === 3) {
            }
            else {
                const queryCheck = `
                                    SELECT p.id as module_name FROM permission p
                                    left join module_detail md on md.id = p.module_detail_id
                                    left join module m on m.id = md.module_id
                                    where p.role_id = ? and md.action = 'index-all' and m.url = 'customers'
                                `
                const checkRole = await database.executeQuery(queryCheck, [role_id]) as RowDataPacket
                //console.log(checkRole)
                //console.log(user_id, created_id)
                if (checkRole.length === 0 && user_id != created_id) {
                    return {
                        data: []
                    }
                }
            }
        }
        const getOrderByCreatedId = await this.findAllByCreatedId(key, name, phone, pageDefault, limitDefaul, created_id, fromDate, toDate, 5, date, role_id);
        if (getOrderByCreatedId instanceof Error) {
            return {
                data: []
            }
        }
        const orders = (getOrderByCreatedId as RowDataPacket).data;
        // //console.log("orders", orders);

        let commissionList: any[] = [];
        let totalCommission = 0;
        for (let i = 0; i < orders.length; i++) {
            const order = orders[i]
            for (let j = 0; j < order.order_detail.length; j++) {
                const detail = order.order_detail[j];
                let commissionValue: number = 0;
                try {
                    const resultProductCommission = await this.productCommissionService.findByProductId(detail.product_id);
                    if (resultProductCommission instanceof Error) { } else {
                        commissionValue = Number.parseFloat((resultProductCommission as any).data.commission);
                    }
                } catch (error) {
                    //console.log("error", error);
                }
                const totalPrice = detail.totalPrice;
                const totalPriceAfterDiscount = detail.totalPriceAfterDiscount;
                const commissionPercentage = commissionValue;
                const commissionAmount = parseFloat((totalPriceAfterDiscount * (commissionValue / 100)).toFixed(2));

                const commissionData = {
                    created_at: order.created_at,
                    completed_date: order.completed_date,
                    code: order.code,
                    product_id: detail.product_id,
                    name: detail.name,
                    unit_name: detail.unit_name,
                    quantity: detail.quantity,
                    price: (detail.price) ? Number.parseFloat(detail.price) : 0,
                    price_type: (detail.price_type) ? Number.parseFloat(detail.price_type) : 0,
                    price_wholesale: (detail.price_wholesale) ? Number.parseFloat(detail.price_wholesale) : 0,
                    totalPrice: totalPrice,
                    discount_type: (detail.discount_type) ? Number.parseFloat(detail.discount_type) : 0,
                    discount_type_name: (detail.discount_type != undefined) ? this.convertDiscountTypeToName(detail.discount_type) : '',
                    discount_value: (detail.discount_value) ? Number.parseFloat(detail.discount_value) : 0,
                    totalPriceAfterDiscount: totalPriceAfterDiscount,
                    commission_percentage: commissionPercentage,
                    commission_amount: commissionAmount,
                };

                // //console.log("commissionData", commissionData);
                commissionList.push(commissionData);
                totalCommission += commissionAmount;
            }
        }
        let pagination: IPagiantion = {
            page: null,
            limit: null,
            totalPage: null
        }
        let paginatedItems = commissionList;
        if (page && limit && page > 0 && limit > 0) {
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            paginatedItems = commissionList.slice(startIndex, endIndex);
            pagination = {
                page: page,
                limit: limit,
                totalPage: Math.ceil(commissionList.length / limit)
            }
        }
        return {
            fromDate: fromDate,
            toDate: toDate,
            created_id: created_id,
            created_name: orders[0].created_name,
            totalCommission: totalCommission,
            commission: paginatedItems,
            pagination: pagination
        }
    }
    private checkPrice = async (model: CreateDto) => {
        for (let i = 0; i < (model as RowDataPacket).order_details.length; i++) {
            const detail = (model as RowDataPacket).order_details[i];
            if (detail.price < 0) {
                return new HttpException(400, errorMessages.PRICE_INVALID, 'price');
            }
            if (detail.quantity < 0) {
                return new HttpException(400, errorMessages.QUANTITY_INVALID, 'quantity');
            }
            if (detail.discount_value != undefined) {
                if (detail.discount_value < 0) {
                    return new HttpException(400, errorMessages.DISCOUNT_VALUE_INVALID, 'discount_value');
                }
                if (detail.discount_type == 1 && detail.discount_value > 100) {
                    return new HttpException(400, errorMessages.DISCOUNT_VALUE_INVALID, 'discount_value');
                }
                if (detail.discount_type == 2 && detail.discount_value != undefined) {
                    if (detail.discount_value > detail.price) {
                        return new HttpException(400, errorMessages.DISCOUNT_VALUE_INVALID, 'discount_value');

                    }
                }
            }
        }
    }

    public findAllCommissionProductByCreatedId = async (key: string, name: string, phone: string, page: number, limit: number, created_id: number, fromDate: string, toDate: string, status: number, date: string) => {
        const pageDefault = undefined;
        const limitDefaul = undefined;

        const getOrderByCreatedId = await this.findAllByCreatedId(
            key,
            name,
            phone,
            pageDefault,
            limitDefaul,
            created_id,
            fromDate,
            toDate,
            5,
            date
        );

        if (getOrderByCreatedId instanceof Error) {
            return {
                data: [],
            };
        }

        const orders = (getOrderByCreatedId as RowDataPacket).data;
        let groupedByProduct: any = {};
        let totalCommission = 0;

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            for (let j = 0; j < order.order_detail.length; j++) {
                const detail = order.order_detail[j];
                let commissionValue: number = 0;

                try {
                    const resultProductCommission = await this.productCommissionService.findByProductId(detail.product_id);
                    if (resultProductCommission instanceof Error) {
                    } else {
                        commissionValue = Number.parseFloat((resultProductCommission as any).data.commission);
                    }
                } catch (error) {
                    //console.log("error", error);
                }

                const totalPrice = detail.totalPrice;
                const totalPriceAfterDiscount = detail.totalPriceAfterDiscount;
                const commissionPercentage = commissionValue;
                const commissionAmount = parseFloat((totalPriceAfterDiscount * (commissionValue / 100)).toFixed(2));

                if (!groupedByProduct[detail.product_id]) {

                    let procductCode = '';
                    const checkProduct = await checkExist('product', 'id', detail.product_id.toString());
                    if (checkProduct instanceof Error) { } else {
                        procductCode = checkProduct[0].code
                    }
                    groupedByProduct[detail.product_id] = {
                        // created_at: order.created_at,
                        // code: order.code,
                        id: detail.product_id,
                        code: procductCode,
                        name: detail.name,
                        unit_name: detail.unit_name,
                        quantity: detail.quantity,
                        price: (detail.price) ? Number.parseFloat(detail.price) : 0,
                        totalPrice: totalPrice,
                        totalPriceAfterDiscount: totalPriceAfterDiscount,
                        commission_percentage: commissionPercentage,
                        commission_amount: commissionAmount,
                        // discount_type_name: (detail.discount_type != undefined) ? this.convertDiscountTypeToName(detail.discount_type) : '',
                    };
                } else {
                    groupedByProduct[detail.product_id].quantity += detail.quantity;
                    groupedByProduct[detail.product_id].totalPrice += totalPrice;
                    groupedByProduct[detail.product_id].totalPriceAfterDiscount += totalPriceAfterDiscount;
                    groupedByProduct[detail.product_id].commission_amount += commissionAmount;
                }

                totalCommission += commissionAmount;
            }
        }
        const commissionList = Object.values(groupedByProduct);

        let pagination: IPagiantion = {
            page: null,
            limit: null,
            totalPage: null,
        };

        let paginatedItems = commissionList;
        if (page && limit && page > 0 && limit > 0) {
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            paginatedItems = commissionList.slice(startIndex, endIndex);
            pagination = {
                page: page,
                limit: limit,
                totalPage: Math.ceil(commissionList.length / limit),
            };
        }
        return {
            fromDate: fromDate,
            toDate: toDate,
            created_id: created_id,
            created_name: orders[0].created_name,
            totalCommission: totalCommission,
            commission: paginatedItems,
            pagination: pagination,
        };
    };


    public searchReportRevenue = async (key: string, name: string, phone: string, page: number | undefined, limit: number | undefined, created_id: number, fromDate: string, toDate: string, status: number, date: string, status_payment: number, isFilter: boolean, employee_id: number, transaction?: boolean) => {
        // if (date != undefined && fromDate == undefined && toDate == undefined) {
        //     fromDate = date + ' 00:00:00'
        //     toDate = date + ' 23:59:59'
        // }
        // if (fromDate != undefined && toDate != undefined) {
        //     fromDate = Time.addTimeIfMissing(fromDate, '00:00:00');
        //     toDate = Time.addTimeIfMissing(toDate, '23:59:59');
        // }
        // let query = `select o.* , ct.name as city_name, dt.name as district_name, wd.name as ward_name from ${this.tableName} o join (select order_id, status, created_at, row_number() over (partition by order_id order by created_at desc) as rn from order_status_history ) os 
        //  on o.id = os.order_id left join city ct on ct.id = o.city_id  left join district dt on dt.id = o.district_id left join ward wd on wd.id = o.ward_id where 1=1
        //  ${fromDate ? 'and o.created_at >= ?' : ''} ${toDate ? 'and o.created_at <= ?' : ''} and os.rn = 1 and 1 = 1`;


        // if (date !== undefined && fromDate == undefined && toDate == undefined) {
        //     fromDate = date + ' 00:00:00'
        //     toDate = date + ' 23:59:59'
        // }
        // if (fromDate != undefined && toDate != undefined) {
        //     fromDate = Time.addTimeIfMissing(fromDate, '00:00:00');
        //     toDate = Time.addTimeIfMissing(toDate, '23:59:59');
        // }
        let query = ` select o.*, ct.name as city_name, dt.name as district_name, wd.name as ward_name, os.completed_date from orders o  join ( select order_id, created_at as completed_date, row_number() over (partition by order_id order by created_at desc) as rn from order_status_history where status = 5 ) os on o.id = os.order_id left join city ct on ct.id = o.city_id left join district dt on dt.id = o.district_id left join ward wd on wd.id = o.ward_id where 1=1  and os.rn = 1 and 1=1 `;
        const queryParams: any[] = [];
        // if (fromDate !== undefined) {
        //     queryParams.push(fromDate);
        // }
        // if (toDate !== undefined) {
        //     queryParams.push(toDate);
        // }
        if (key != undefined) {
            query += ` and ( o.code like ? or o.name like ? or o.phone like ? or o.address like ? ) `;
            queryParams.push(`%${key}%`, `%${key}%`, `%${key}%`, `%${key}%`);
        }
        if (created_id !== undefined && created_id != 1) {
            query += ` and o.created_id = ?`;
            queryParams.push(created_id);
        }

        if (isFilter == true && employee_id != undefined) {
            //console.log('isFilter', isFilter);
            query += ` and o.created_id = ?`;
            queryParams.push(employee_id);
        }
        if (status != undefined) {
            query += ` and o.status = ?`;
            queryParams.push(status);
        }
        if (phone != undefined) {
            query += ` and o.phone like ?`;
            queryParams.push(`%${phone}%`);
        }
        if (name != undefined) {
            query += ` and o.name like ?`;
            queryParams.push(`%${name}%`);
        }
        if (status_payment != undefined) {
            query += ` and o.status_payment = ?`;
            queryParams.push(status_payment);
        }
        //order khac status 5 va 6
        if (transaction == true) {
            query += ` and o.status != 5 and o.status != 6`;
        }
        query += ` order by o.id desc`;

        const count = await database.executeQuery(query, queryParams);
        if (page && page < 1 || page && limit! < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (page && limit)
            query = query + ` LIMIT ` + limit + ` OFFSET ` + (page - 1) * limit;
        try {
            const result = await database.executeQuery(query, queryParams);
            if (Array.isArray(result) && result.length === 0) {
                return new HttpException(400, errorMessages.NOT_FOUND);
            }
            const totalPages = Math.ceil((count as any).length / limit!);

            for (let i = 0; i < (result as any).length; i++) {
                const orderDetail = await this.orderDetailService.findAllOrderDetailByOrderId((result as any)[i].id);
                (result as any)[i].order_detail = (orderDetail as any).data;
                for (let j = 0; j < (result as any)[i].order_detail.length; j++) {
                    const product = await this.productService.findById((result as any)[i].order_detail[j].product_id);
                    if (!(product instanceof Error)) {
                        const images = (product as any).data.images || null;
                        const name = (product as any).data.name;
                        const productCode = (product as any).data.code;
                        (result as any)[i].order_detail[j].name = name;
                        (result as any)[i].order_detail[j].code = productCode;
                        (result as any)[i].order_detail[j].image_thumbnail = images ? images[0].image_thumbnail : null;
                    }
                    // const calcPrice: ICalculateOrder = {
                    //     price: (result as any)[i].order_detail[j].price,
                    //     quantity: (result as any)[i].order_detail[j].quantity,
                    //     discount_value: (result as any)[i].order_detail[j].discount_value,
                    //     discount_type: (result as any)[i].order_detail[j].discount_type
                    // };
                    const calcPrice: ICalculateOrder = {
                        price: (result as any)[i].order_detail[j].price,
                        quantity: (result as any)[i].order_detail[j].quantity,
                        discount_value: (result as any)[i].order_detail[j].discount_value,
                        discount_type: (result as any)[i].order_detail[j].discount_type,
                        price_type: (result as any)[i].order_detail[j].price_type,
                        price_wholesale: (result as any)[i].order_detail[j].price_wholesale

                    };
                    (result as RowDataPacket)[i].order_detail[j].discount_type_name = this.convertDiscountTypeToName((result as any)[i].order_detail[j].discount_type);
                    const calcValue = this.calcTotalPrice(calcPrice);
                    (result as any)[i].order_detail[j].totalPrice = calcValue.totalPrice;
                    (result as any)[i].order_detail[j].totalPriceAfterDiscount = calcValue.totalPriceAfterDiscount;

                    //tong chietkhau
                    // (result as RowDataPacket)[i].order_detail[j].totalDiscount = ((result as RowDataPacket)[i].order_detail[j].discount_value * (result as RowDataPacket)[i].order_detail[j].quantity);
                    (result as RowDataPacket)[i].order_detail[j].totalDiscount = calcValue.totalDiscount;
                    const resultStatusId = await this.orderStatusService.findAllOrderStatusByOrderId((result as any)[i].id);
                    const statusId = (resultStatusId as any).data[0].status;
                    (result as RowDataPacket)[i].status = statusId;
                    (result as RowDataPacket)[i].status_name = convertPushlishNumberToOrderStatus(statusId);
                    // status payment name
                    (result as RowDataPacket)[i].status_payment_name = convertOrderStatusPayment((result as RowDataPacket)[i].status_payment);

                    (result as any)[i].pay_method_name = this.convertPaymentMethod((result as any)[i].pay_method);
                    (result as any)[i].ship_method_name = this.convertShipMethod((result as any)[i].ship_method);
                }

                const resultOrderStatus = await this.orderStatusService.findAllStatusByOrderId((result as any)[i].id);
                if (!(resultOrderStatus instanceof Error)) {
                    (result as RowDataPacket)[i] = { ...(result as RowDataPacket)[i], ...(resultOrderStatus as any).data };
                }
                if ((result as any)[i].created_id && (result as any)[i].created_id != undefined) { // them check exist
                    const checkUserCreate = await checkExist('users', 'id', (result as any)[i].created_id.toString())
                    if (checkUserCreate && checkUserCreate[0] != undefined) {
                        (result as any)[i].created_name = checkUserCreate[0].name + ' ' + checkUserCreate[0].phone;
                        (result as any)[i].employee_name = checkUserCreate[0].name;
                    }
                }
                const total = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalPrice, 0);
                (result as any)[i].totalPrice = total;

                const totalDiscount = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalDiscount, 0);
                (result as any)[i].totalDiscount = totalDiscount;

                const totalPriceAfterDiscount = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalPriceAfterDiscount, 0);
                (result as any)[i].totalPriceAfterDiscount = totalPriceAfterDiscount;
            }
            const pagination: IPagiantion = {
                page: page,
                limit: limit,
                totalPage: totalPages
            };

            return {
                data: result,
                pagination: pagination,
            };

        } catch (error) {
            return new HttpException(500, errorMessages.FAILED);
        }
    }
    public reportRevenue = async (
        key: string,
        name: string,
        phone: string,
        page: number | undefined,
        limit: number | undefined,
        created_id: number,
        fromDate: string,
        toDate: string,
        status: number,
        date: string,
        status_payment: number,
        isFilter: boolean,
        employee_id: number,
        transaction: boolean,
        type_revenue: string,
        year: number,
        month?: number
    ) => {
        const getAllOrder = await this.searchReportRevenue(key, name, phone, undefined, undefined, created_id, fromDate, toDate, 5, date, status_payment, isFilter, employee_id);
        if (getAllOrder instanceof Error) {
            return { data: [] };
        }

        const revenueCalc = new RevenueCalc();
        let reportRevenue = await revenueCalc.calculateRevenue((getAllOrder as RowDataPacket).data, year, month);
        return {
            data: reportRevenue ? reportRevenue.data : [],
            summary: reportRevenue ? reportRevenue.summary : {},
        }
    }
    public reportOrderQuantity = async (created_id: number) => {
        const listStatus: IReportStatus[] = [
            { status: 1, total_orders: 0 },
            { status: 2, total_orders: 0 },
            { status: 3, total_orders: 0 },
            { status: 4, total_orders: 0 },
            { status: 5, total_orders: 0 },
            { status: 6, total_orders: 0 },
        ]
        let query = ``;
        let result: any;
        if (created_id != 1) {
            query = `select status, count(*) as total_orders from orders where created_id = ? group by status`;
            result = await database.executeQuery(query, [created_id]);
        } else {
            query = `select status, count(*) as total_orders from orders group by status`;
            result = await database.executeQuery(query);
        }
        if (result instanceof Error) {
            return { data: listStatus };
        }
        for (let i = 0; i < (result as RowDataPacket).length; i++) {
            const status = (result as RowDataPacket)[i].status;
            const total_orders = (result as RowDataPacket)[i].total_orders;
            const index = listStatus.findIndex(item => item.status == status);
            if (index != -1) {
                listStatus[index].total_orders = total_orders;
            }
        }
        return { data: listStatus };
    }
    public reportOrderQuantityByCreatedId = async (key: string,
        name: string,
        phone: string,
        page: number | undefined,
        limit: number | undefined,
        created_id: number,
        fromDate: string,
        toDate: string,
        status: number,
        date: string,
        status_payment: number,
        isFilter: boolean,
        employee_id: number,
        transaction: boolean,
    ) => {
        const getAllOrder = await this.searchReportRevenue(key, name, phone, undefined, undefined, created_id, fromDate, toDate, 5, date, status_payment, isFilter, employee_id);
        if (getAllOrder instanceof Error) {
            return { data: [] };
        }
        const data = this.calculateRevenue((getAllOrder as RowDataPacket).data);
        return {
            data: {
                revenue: data
            }
        }
    }

    public calculateRevenue(orders: any[]) {
        return orders.reduce((total, order) => {
            return total + order.totalPriceAfterDiscount;
        }, 0);
    }
    public reportRevenueMonthOfYear = async (created_id: number, role_id: number, seller_id: number) => {
        //console.log(created_id, seller_id, role_id)
        let query = '';
        let params: any = [];
        query = `
            select month(osh.created_at) as month, sum(od.quantity * od.price) as amount  
            from orders o 
            join order_detail od on o.id = od.order_id  
            join order_status_history osh on o.id = osh.order_id 
            where o.seller_id = ? `;
        params.push(seller_id);

        if (role_id) {
            if (role_id === 1 || role_id === 3) {
            }
            else {
                const queryCheck = `
                        SELECT p.id as module_name FROM permission p
                        left join module_detail md on md.id = p.module_detail_id
                        left join module m on m.id = md.module_id
                        where p.role_id = ? and md.action = 'index-all' and m.url = 'orders'
                    `
                const checkRole = await database.executeQuery(queryCheck, [role_id]) as RowDataPacket
                //console.log(checkRole)
                if (checkRole.length === 0) {
                    query += ` and o.created_id = ? `;
                    params.push(created_id);
                }
            }
        }
        query += `and osh.status = 5 and year(osh.created_at) = year(current_date) group by month(osh.created_at) 
                order by month(osh.created_at)
            `
        //console.log(query, params)
        const result = await database.query(query, params);
        if (result instanceof Error) { }
        else {
            const dataArray = Object.values(result as RowDataPacket);
            const currentMonth = new Date().getMonth() + 1
            let report = Array.from({ length: currentMonth }, (_, index) => ({
                column: 'Tháng ' + (index + 1),
                amount: 0
            }));
            (dataArray as RowDataPacket).forEach((item: any) => {
                const monthIndex = item.month - 1
                if (monthIndex < currentMonth) {
                    report[monthIndex].amount = Number(item.amount);
                }
            });
            return { data: report };
        }
    }




    public searchs = async (key: string, name: string, phone: string, page: number | undefined, limit: number | undefined, created_id: number, fromDate: string, toDate: string, status: number, date: string, status_payment: number, isFilter: boolean, employee_id: number, transaction?: boolean, seller_id?: number, role_id?: number) => {
        //console.log("key", page, "isFilter", limit)
        if (date != undefined && fromDate == undefined && toDate == undefined) {
            fromDate = date + ' 00:00:00'
            toDate = date + ' 23:59:59'
        }
        if (fromDate != undefined && toDate != undefined) {
            fromDate = Time.addTimeIfMissing(fromDate, '00:00:00');
            toDate = Time.addTimeIfMissing(toDate, '23:59:59');
        }
        let query = `
           SELECT DISTINCT o.*, ct.name AS city_name, dt.name AS district_name, wd.name AS ward_name,
            IFNULL(odh.order_detail, '') AS order_detail,
            CASE o.status
                WHEN 1 THEN 'Đơn hàng mới'
                WHEN 2 THEN 'Đã duyệt'
                WHEN 3 THEN 'Đóng gói'
                WHEN 7 THEN 'Chờ lấy hàng'
                WHEN 4 THEN 'Đang giao hàng'
                WHEN 5 THEN 'Hoàn thành'
                WHEN 6 THEN 'Đã hủy'
            END AS status_name,
            CASE o.status_payment
                WHEN 0 THEN 'Chưa thanh toán'
                WHEN 1 THEN 'Đã thanh toán'
                WHEN 2 THEN 'Chờ thanh toán'
            END AS status_payment_name,
            CASE o.status_payment
                WHEN 1 THEN odh.totalPriceAfterDiscount
                ELSE 0
            END AS status_payment_name,
            CASE o.pay_method
                WHEN 1 THEN 'Tiền mặt'
                WHEN 2 THEN 'Chuyển khoản'
                WHEN 3 THEN 'Quẹt thẻ'
                ELSE 'Phương thức thanh toán không tồn tại'
            END AS pay_method_name,
            
            CASE o.pay_method
                WHEN 1 THEN 'Nhận hàng tại cửa hàng'
                WHEN 2 THEN 'Giao hàng tận nơi'
                ELSE 'Phương thức giao hàng không tồn tại'
            END AS ship_method_name,
            osh.created_at       AS created_at,
            osh2.created_at      AS processing_at,
            osh3.created_at      AS packing_at,
            osh4.created_at      AS delivering_at,
            osh5.created_at      AS completed_at,
            osh6.created_at      AS canceled_at,
            CONCAT(u.name, ' ', u.phone) AS created_name,
            u.name AS employee_name,
            odh.totalPrice,
            odh.totalPriceAfterDiscount,
            odh.totalDiscount,
            dn.delivery_type,
            odm.method as delivery_method
            FROM orders o
            LEFT JOIN city ct ON ct.id = o.city_id
            LEFT JOIN district dt ON dt.id = o.district_id 
            LEFT JOIN ward wd ON wd.id = o.ward_id
            LEFT JOIN users u ON u.id = o.created_id
            LEFT JOIN delivery_note dn ON dn.order_id = o.id AND dn.type = "xuat_kho_ban_le"
            LEFT JOIN order_delivery_method odm ON odm.order_id = o.id
            LEFT JOIN (
            SELECT 
                od.order_id,
                CONCAT(
                GROUP_CONCAT(
                    DISTINCT JSON_OBJECT(
                    'id', od.id,
                    'order_id', od.order_id,
                    'product_id', od.product_id,
                    'quantity', od.quantity,
                    'price', od.price,
                    'price_sale', od.price_sale,
                    'price_wholesale', od.price_wholesale,
                    'discount_value', od.discount_value,
                    'discount_type', od.discount_type,
                    'price_type', od.price_type,
                    'seller_id', od.seller_id,
                    'unit_id', pu.id,
                    'unit_name', pu.name,
                    'name', p.name,
                    'code', p.code,
                    'type', p.type,
                    'image_thumbnail', IFNULL(CONCAT('uploads${process.env.PRODUCT_UPLOAD_IMAGE}/', p.code, '/thumbnail/', pi.image), NULL),
                    'discount_type_name', IF(od.discount_type = 1, '%', IF(od.discount_type = 0, 'Không có', 'Tiền mặt')),
                    'totalPrice', od.quantity * od.price,
                    'totalPriceAfterDiscount', IF(od.discount_type = 1, od.quantity * od.price * (1 - od.discount_value / 100), od.quantity * od.price - od.discount_value),
                    'totalDiscount', IF(od.discount_type = 1, od.quantity * od.price * od.discount_value / 100, od.discount_value)
                    ) ORDER BY od.id DESC
                    SEPARATOR ','
                )
                ) AS order_detail,
                SUM(od.quantity * od.price) AS totalPrice,
                SUM(
                IF(od.discount_type = 1, od.quantity * od.price * (1 - od.discount_value / 100), od.quantity * od.price - od.discount_value)
                ) AS totalPriceAfterDiscount,
                SUM(od.quantity * od.price) - SUM(
                IF(od.discount_type = 1, od.quantity * od.price * (1 - od.discount_value / 100), od.quantity * od.price - od.discount_value)
                ) AS totalDiscount
            FROM order_detail od
            LEFT JOIN product p ON od.product_id = p.id 
            LEFT JOIN product_unit pu ON pu.id = p.unit_id
            LEFT JOIN product_image pi ON pi.product_id = p.id 
                AND pi.id = (
                    SELECT MIN(id)
                    FROM product_image
                    WHERE product_image.product_id = p.id
                )
            GROUP BY od.order_id
            ) odh ON odh.order_id = o.id
            LEFT JOIN order_status_history osh  ON osh.order_id = o.id AND osh.status = 1
            LEFT JOIN order_status_history osh2 ON osh2.order_id = o.id AND osh2.status = 2
            LEFT JOIN order_status_history osh3 ON osh3.order_id = o.id AND osh3.status = 3
            LEFT JOIN order_status_history osh4 ON osh4.order_id = o.id AND osh4.status = 4
            LEFT JOIN order_status_history osh5 ON osh5.order_id = o.id AND osh5.status = 5
            LEFT JOIN order_status_history osh6 ON osh6.order_id = o.id AND osh6.status = 6
            where 1=1
         ${fromDate ? 'and o.created_at >= ?' : ''} ${toDate ? 'and o.created_at <= ?' : ''}`;
        const queryParams: any[] = [];
        if (fromDate !== undefined) {
            queryParams.push(fromDate);
        }
        if (toDate !== undefined) {
            queryParams.push(toDate);
        }
        if (key !== undefined) {
            query += ` and ( o.code like ? or o.name like ? or o.phone like ? or o.address like ? ) `;
            queryParams.push(`%${key}%`, `%${key}%`, `%${key}%`, `%${key}%`);
        }
        if (created_id !== undefined && created_id != 1 && role_id) {
            if (role_id === 1 || role_id === 3) {
            }
            else {
                const queryCheck = `
                    SELECT p.id as module_name FROM permission p
                    left join module_detail md on md.id = p.module_detail_id
                    left join module m on m.id = md.module_id
                    where p.role_id = ? and md.action = 'index-all' and m.url = 'orders'
                `
                const checkRole = await database.executeQuery(queryCheck, [role_id]) as RowDataPacket
                //console.log(checkRole)
                if (checkRole.length === 0) {
                    query += ` and o.created_id = ?`;
                    queryParams.push(created_id);
                }
            }
        }
        if (seller_id != undefined) {
            query += ` and o.seller_id = ?`;
            queryParams.push(seller_id);
        }
        if (isFilter === true && employee_id !== undefined) {
            //console.log('isFilter', isFilter);
            query += ` and o.created_id = ?`;
            queryParams.push(employee_id);
        }
        if (status !== undefined) {
            query += ` and o.status = ?`;
            queryParams.push(Number(status));
        }
        if (phone !== undefined) {
            query += ` and o.phone like ?`;
            queryParams.push(`%${phone}%`);
        }
        if (name !== undefined) {
            query += ` and o.name like ?`;
            queryParams.push(`%${name}%`);
        }
        if (status_payment !== undefined) {
            query += ` and o.status_payment = ?`;
            queryParams.push(status_payment);
        }
        //order khac status 5 va 6
        if (transaction === true) {
            query += ` and o.status != 5 and o.status != 6`;
        }
        query += ` group by o.id order by o.id desc`;
        //console.log(query, queryParams);
        const resultNotPagination = await database.executeQuery(query, queryParams);
        if (Array.isArray(resultNotPagination) && resultNotPagination.length === 0) { }
        const listStatus: IReportStatus[] = [
            { status: 1, total_orders: 0 },
            { status: 2, total_orders: 0 },
            { status: 3, total_orders: 0 },
            { status: 4, total_orders: 0 },
            { status: 5, total_orders: 0 },
            { status: 6, total_orders: 0 },
        ]
        const count = await database.executeQuery(query, queryParams);
        if (page && page < 1 || page && limit! < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (page && limit)
            query = query + ` LIMIT ` + limit + ` OFFSET ` + (page - 1) * limit;
        try {
            const result = await database.executeQuery(query, queryParams) as RowDataPacket[];
            if (Array.isArray(result) && result.length === 0) {
                return new HttpException(400, errorMessages.NOT_FOUND);
            }
            const totalPages = Math.ceil((count as any).length / limit!);
            const resultMap = new Map();
            for (const item of resultNotPagination as any) {
                const status = item.status
                if (resultMap.has(status)) {
                    resultMap.get(status).push(item);
                } else {
                    resultMap.set(status, [item]);
                }
            }
            const statusMap = new Map()
            for (const item of listStatus) {
                statusMap.set(item.status, item);
            }
            for (const [status, items] of resultMap) {
                const statusItem = statusMap.get(status);
                if (statusItem) {
                    statusItem.total_orders += items.length
                }
            }
            const pagination: IPagiantion = {
                page: page,
                limit: limit,
                totalPage: totalPages
            };
            //console.log(result);

            return {
                data: result.map((item: any) => {
                    return {
                        ...item,
                        order_detail: JSON.parse('[' + item.order_detail + ']')
                    }
                }),
                pagination: pagination,
                listStatus: listStatus
            };

        } catch (error) {
            return new HttpException(500, errorMessages.FAILED);
        }
    }

    public reportRevenueAndSalaryMonthOfYear = async (created_id: number, role_id: number, seller_id: number, month?: number, year?: number) => {
        //console.log(month, year)
        const date = new Date();
        const cur_month = date.getMonth() + 1;
        const cur_year = date.getFullYear();
        let query = '';
        let params: any = [];
        query = `
            select 
            CEIL(SUM(od.quantity * od.price)) AS revenue,
            CEIL(SUM(od.quantity * od.price * 
                (SELECT commission FROM product_commission WHERE product_id = od.product_id) / 100)) AS salary
            from orders o 
            join order_detail od on o.id = od.order_id  
            join order_status_history osh on o.id = osh.order_id 
            where o.seller_id = ? `;
        params.push(seller_id);

        if (role_id) {
            //console.log(role_id)
            if (role_id === 1 || role_id === 3) {
            }
            else {
                const queryCheck = `
                        SELECT p.id as module_name FROM permission p
                        left join module_detail md on md.id = p.module_detail_id
                        left join module m on m.id = md.module_id
                        where p.role_id = ? and md.action = 'index-all' and m.url = 'orders'
                    `
                const checkRole = await database.executeQuery(queryCheck, [role_id]) as RowDataPacket
                //console.log(checkRole.length, checkRole.length === 0)
                if (checkRole.length === 0) {
                    query += ` and o.created_id = ? `;
                    params.push(created_id);
                }
            }
        }
        query += `and osh.status = 5 and month(osh.created_at) = ${month || cur_month} and year(osh.created_at) = ${year || cur_year} group by month(osh.created_at) 
                order by month(osh.created_at)
            `
        //console.log(query, params)
        const result = await database.query(query, params) as RowDataPacket
        if (result.length > 0) {
            return {
                data: {
                    revenue: result[0].revenue,
                    salary: (role_id === 1 || role_id === 3) ? 0 : result[0].salary,
                }
            };
        }
        return {
            data: {
                revenue: 0,
                salary: 0,
            }
        }
    }

    public checkCanDelivery = async (listOrderId: number[]) => {
        if (listOrderId.length < 1) {
            return new HttpException(400, errorMessages.MISSING_DATA);
        }
        const order = await database.executeQuery(`SELECT id FROM ${this.tableName} WHERE id IN (${listOrderId}) AND status = 3`) as RowDataPacket
        return {
            data: {
                success: order.length || 0,
                fail: listOrderId.length - order.length || 0,
                success_list: order.map((item: any) => item.id)
            }
        }
    }

    public getOrderByListId = async (listOrderId: number[]) => {
        const query = `
            SELECT DISTINCT o.*, ct.name AS city_name, dt.name AS district_name, wd.name AS ward_name,
            IFNULL(odh.order_detail, '') AS order_detail,
            odh.totalPrice,
            odh.totalPriceAfterDiscount,
            odh.totalDiscount,
            odm.method as delivery_method,
            CASE 
                WHEN odm.method = 'shipper' THEN 'Shipper tự liên hệ' 
                WHEN odm.method = 'delivery' THEN 'Đối tác vận chuyển' 
                WHEN odm.method = 'shop' THEN 'Nhận tại cửa hàng' 
            END AS doi_tac,
            CASE 
                WHEN odm.method = 'shipper' THEN (select name from shipers where id = odm.shipper_id)
                WHEN odm.method = 'delivery' THEN odm.ship_key
                WHEN odm.method = 'shop' THEN 'Nhận tại cửa hàng' 
            END AS ten_doi_tac,
            odm.shipper_id,
            odm.ship_fee,
            odm.ship_fee_payer
            FROM orders o
            LEFT JOIN city ct ON ct.id = o.city_id
            LEFT JOIN district dt ON dt.id = o.district_id 
            LEFT JOIN ward wd ON wd.id = o.ward_id
            LEFT JOIN users u ON u.id = o.created_id
            LEFT JOIN order_delivery_method odm ON odm.order_id = o.id
            LEFT JOIN (
            SELECT 
                od.order_id,
                CONCAT(
                GROUP_CONCAT(
                    DISTINCT JSON_OBJECT(
                    'id', od.id,
                    'order_id', od.order_id,
                    'product_id', od.product_id,
                    'quantity', od.quantity,
                    'price', od.price,
                    'price_sale', od.price_sale,
                    'price_wholesale', od.price_wholesale,
                    'discount_value', od.discount_value,
                    'discount_type', od.discount_type,
                    'price_type', od.price_type,
                    'seller_id', od.seller_id,
                    'unit_id', pu.id,
                    'unit_name', pu.name,
                    'name', p.name,
                    'code', p.code,
                    'type', p.type,
                    'image_thumbnail', IFNULL(CONCAT('uploads${process.env.PRODUCT_UPLOAD_IMAGE}/', p.code, '/thumbnail/', pi.image), NULL),
                    'discount_type_name', IF(od.discount_type = 1, '%', IF(od.discount_type = 0, 'Không có', 'Tiền mặt')),
                    'totalPrice', od.quantity * od.price,
                    'totalPriceAfterDiscount', IF(od.discount_type = 1, od.quantity * od.price * (1 - od.discount_value / 100), od.quantity * od.price - od.discount_value),
                    'totalDiscount', IF(od.discount_type = 1, od.quantity * od.price * od.discount_value / 100, od.discount_value)
                    ) ORDER BY od.id DESC
                    SEPARATOR ','
                )
                ) AS order_detail,
                SUM(od.quantity * od.price) AS totalPrice,
                SUM(
                IF(od.discount_type = 1, od.quantity * od.price * (1 - od.discount_value / 100), od.quantity * od.price - od.discount_value)
                ) AS totalPriceAfterDiscount,
                SUM(od.quantity * od.price) - SUM(
                IF(od.discount_type = 1, od.quantity * od.price * (1 - od.discount_value / 100), od.quantity * od.price - od.discount_value)
                ) AS totalDiscount
            FROM order_detail od
            LEFT JOIN product p ON od.product_id = p.id 
            LEFT JOIN product_unit pu ON pu.id = p.unit_id
            LEFT JOIN product_image pi ON pi.product_id = p.id 
                AND pi.id = (
                    SELECT MIN(id)
                    FROM product_image
                    WHERE product_image.product_id = p.id
                )
            GROUP BY od.order_id
            ) odh ON odh.order_id = o.id
            LEFT JOIN order_status_history osh  ON osh.order_id = o.id AND osh.status = 1
            LEFT JOIN order_status_history osh2 ON osh2.order_id = o.id AND osh2.status = 2
            LEFT JOIN order_status_history osh3 ON osh3.order_id = o.id AND osh3.status = 3
            LEFT JOIN order_status_history osh4 ON osh4.order_id = o.id AND osh4.status = 4
            LEFT JOIN order_status_history osh5 ON osh5.order_id = o.id AND osh5.status = 5
            LEFT JOIN order_status_history osh6 ON osh6.order_id = o.id AND osh6.status = 6
            where ${listOrderId.length > 0 ? `o.id in (${listOrderId}) and` : ''} o.status = 3
        `
        const order = await database.executeQuery(query) as RowDataPacket
        if (order.length < 1) {
            return new HttpException(400, errorMessages.SEARCH_FAILED);
        }
        return {
            data: order.map((item: any) => {
                return {
                    ...item,
                    order_detail: JSON.parse('[' + item.order_detail + ']')
                }
            })
        }
    }

    public updateDeliveryMethodList = async (delivery_method: string, shipper_id: number, ship_key: string, ship_fee: number, ship_fee_payer: number, listId: number[]) => {
        console.log(delivery_method, shipper_id, ship_key, ship_fee, ship_fee_payer, listId)
        try {
            for (const item of listId) {
                let fee = 0
                if (delivery_method === 'delivery') {
                    const order_detail = await this.deliveryNoteService.findByIdExpandCombo(item) as any
                    const response = await axios.post(`${process.env.DELIVERY_URL!}/ship_services/get-ship-fee/${'viettelpost'}`, { order: order_detail.data })
                    fee = response.data.data
                }
                const exist = await database.executeQuery(`SELECT * FROM order_delivery_method WHERE order_id = ?`, [item]) as RowDataPacket
                if (exist.length > 0) {
                    const query = `UPDATE order_delivery_method SET method = ?, shipper_id = ?, ship_key = ?, ship_fee = ?, ship_fee_payer = ?, updated_at = ? WHERE order_id = ?`
                    const result = await database.executeQuery(query, [delivery_method, shipper_id || null, delivery_method === 'delivery' ? 'viettelpost' : ship_key || null, delivery_method === 'delivery' ? fee : ship_fee || null, ship_fee_payer || 'Khách trả', new Date(), item]) as RowDataPacket
                    if (result.affectedRows === 0) {
                        return new HttpException(400, errorMessages.UPDATE_FAILED)
                    }
                }
                else {
                    const query = `INSERT INTO order_delivery_method (order_id, method, shipper_id, ship_key, ship_fee, ship_fee_payer, created_at, updated_at) VALUE (?, ?, ?, ?, ?, ?, ?, ?)`
                    const result = await database.executeQuery(query, [item, delivery_method, shipper_id || null, delivery_method === 'delivery' ? 'viettelpost' : ship_key || null, delivery_method === 'delivery' ? fee : ship_fee || null, ship_fee_payer || 'Khách trả', new Date(), new Date()]) as RowDataPacket
                    if (result.affectedRows === 0) {
                        return new HttpException(400, errorMessages.UPDATE_FAILED)
                    }
                }
            }
            const result = await this.getOrderByListId(listId) as any

            return {
                data: result.data
            }
        } catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED)
        }
    }
}

export default OrderService;
