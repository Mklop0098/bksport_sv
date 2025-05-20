import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { convertPushlishNumberToOrderStatus, convertOrderStatusPayment, findById } from "./utils";
import _ from 'lodash';
import PurchaseOrderDetailService from "@modules/purchaseOrderDetail/service";
import OrderStatusService from "@modules/purchaseStatusHistory/service";
import { CreateDto as OrderStatus } from "@modules/purchaseStatusHistory";
import { convertNumberToVND } from "@core/utils/convertNumberToVND";
import { ICalculateOrder, IReportStatus, StatusOrder, StatusPaymentPurchase } from "./interface";
import { calculateTotalPriceAfterDiscount } from "@core/utils/calcTotalPriceAfterDiscount";
import { Time } from "@core/utils/time";
import { CheckOrder } from "./utils/checkOrder";
import { RevenueCalc } from "./utils/revenueCalc";
import moment from "moment";
import PurchaseOrderStatusPaymentService from "@modules/purchaseStatusPaymentHistory/service";
import PurchaseOrderStatusService from "@modules/purchaseStatusHistory/service"
import { CreateDto as PurchaseOrderStatusPaymentModel } from "@modules/purchaseStatusPaymentHistory";
import { generateCodeWithSeller } from "@core/utils/gennerate.code";
import { calculateOrderPaymentStatus } from "./utils/calculateOrderPaymentStatus";
import { CreateDto as StatusHistotyModel } from "@modules/purchaseStatusHistory";
import { StatusPaymentDetail } from "./interface";
import SupplierService from "@modules/supplier/service";
import WarehouseService from "@modules/warehouse/service";
import { CreateDto as WarehourseModel } from "@modules/warehouse";
import { CreateDto as PurchaseStatusHistoryModel } from "@modules/purchaseStatusHistory";
import { CreateDto as DeliveryNoteDto } from "@modules/deliveryNote/dtos/create.dto";
import { CreateDto as DeliveryNoteDetailDto } from "@modules/deliveryNoteDetail/dtos/create.dto";
import DeliveryNoteService from "@modules/deliveryNote/service";
import Ilog from "@core/interfaces/log.interface";
import { StatusDeliveryOrder } from "@modules/deliveryNote/ultils";

class PurchaseOrderService {
    private tableName = 'purchase_order'
    private tableSupplier = 'supplier'
    private fieldId = 'id'
    private tableOrderStatus = 'purchase_order_status_history'
    // private moduleId = 23

    // private productService = new ProductService()
    private orderStatusService = new OrderStatusService()
    private purchaseOrderStatusPaymentService = new PurchaseOrderStatusPaymentService()
    private supplierService = new SupplierService()
    private warehouseService = new WarehouseService()
    private purchaseStatusHistoryService = new PurchaseOrderStatusService()
    private orderDetailService = new PurchaseOrderDetailService()
    private deliveryNoteService = new DeliveryNoteService()

    private addToWarehouse = async (id: number) => {
        const getPurchaseQuery = `
            SELECT po.id as order_id, po.supplier_id, po.branch_id, po.seller_id, pod.product_id, pod.quantity, pod.seller_id, po.created_id
            from purchase_order po 
            LEFT JOIN purchase_order_detail pod ON po.id = pod.order_id
            WHERE po.id = ?
        `
        const result = await database.executeQuery(getPurchaseQuery, [id]) as RowDataPacket
        for (let i = 0; i < result.length; i++) {
            let model: WarehourseModel = result[i]
            try {
                await this.warehouseService.create(model)
            } catch (error) {
                return new HttpException(400, errorMessages.CREATE_FAILED, "warehouse");
            }
        }
        //console.log("result", model)
    }

    public createBeginningInventoryPurchase = async (model: CreateDto) => {

    }

    public create = async (model: CreateDto) => {
        if (!model.supplier_id) model.supplier_id = 0
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
        if (!moment(model.delivery_date, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
            const correctedDate = moment(model.delivery_date).format('YYYY-MM-DD HH:mm:ss');
            model.delivery_date = correctedDate;
        }
        // const check = await checkExist(this.tableSupplier, 'id', model.supplier_id!.toString())
        // if (check == false)
        //     return new HttpException(400, errorMessages.NOT_EXISTED, 'supplier_id');
        if (model.type !== 'import-warehouse-beginning' && model.type !== 'nhap_kho_chuyen') {
            const checkPrice = await this.checkPrice(model);
            if (checkPrice !== undefined && (checkPrice as RowDataPacket) instanceof Error) {
                return new HttpException(400, (checkPrice as RowDataPacket).message, (checkPrice as RowDataPacket).field);
            }
        }
        let code = await generateCodeWithSeller(this.tableName, 'NK', 8, model.seller_id as number) as string;
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
        if (model.type != undefined) {
            fields += 'type,'
            params += '?,'
            values.push(model.type)
        }
        if (model.supplier_id != undefined) {
            fields += 'supplier_id,'
            params += '?,'
            values.push(model.supplier_id)
        }
        if (model.note != undefined) {
            fields += 'note,'
            params += '?,'
            values.push(model.note)
        }
        if (model.branch_id != undefined) {
            fields += 'branch_id,'
            params += '?,'
            values.push(model.branch_id)
        }
        if (model.delivery_date != undefined) {
            fields += 'delivery_date,'
            params += '?,'
            values.push(model.delivery_date)
        }
        if (model.seller_id != undefined) {
            fields += 'seller_id,'
            params += '?,'
            values.push(model.seller_id)
        }

        fields += 'created_at,'
        params += '?,'
        values.push(model.delivery_date)
        fields = fields.slice(0, -1)
        params = params.slice(0, -1)
        query += ` (${fields}) values (${params})`
        //console.log(query, values)
        const result = await database.executeQuery(query, values);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED);
        //orderDetail
        let order_id = (result as any).insertId
        let orderDetail = model.order_details
        if (model.order_details && model.order_details.length <= 0)
            return new HttpException(400, errorMessages.NOT_EXISTED, 'order_details');
        let resultOrderDetail = null
        let orderDetailResult: any = []
        if (orderDetail && orderDetail.length < 1) {
            return new HttpException(400, "Danh sách sản phẩm không được để trống", 'order_details');
        }
        if (orderDetail) {
            for (let element of orderDetail) {
                //console.log(element)
                const regex = /^(0|[1-9]\d*(\.\d+)?|\.\d+)$/;
                if (!regex.test((element as RowDataPacket).price)) {
                    return new HttpException(400, errorMessages.PRICE_MUST_GREATER_THAN_ZERO, 'price');
                }
                resultOrderDetail = await this.orderDetailService.create({
                    order_id: order_id,
                    product_id: element.product_id,
                    quantity: element.quantity,
                    price: element.price_import || element.price,
                    created_id: model.created_id,
                    discount_value: element.discount_value || 0,
                    discount_type: element.discount_type || 0,
                    seller_id: model.seller_id,
                    branch_id: model.branch_id
                })
                orderDetailResult.push((resultOrderDetail as any).data)
            }
        }
        if (model.order_status_payment_history != undefined) {
            for (let i = 0; i < model.order_status_payment_history.length; i++) {
                model.order_status_payment_history[i].seller_id = model.seller_id;
                let statusPaymentModel: PurchaseOrderStatusPaymentModel = {
                    user_id: model.created_id,
                    order_id: (result as RowDataPacket).insertId,
                    amount_paid: model.order_status_payment_history[i].amount_paid,
                    seller_id: model.seller_id,
                    created_at: create_at,
                    payment_method: model.order_status_payment_history[i].payment_method,
                    payment_date: model.order_status_payment_history[i].payment_date,
                    status: model.order_status_payment_history[i].status
                }
                await this.purchaseOrderStatusPaymentService.create(statusPaymentModel);
            }
        }
        let statusLastest: string = '';
        const totalPriceAfterDiscount = (model.order_details != undefined && model.order_details.length > 0) ? calculateTotalPriceAfterDiscount(model.order_details) : 0;

        if (model.type == 'import-warehouse-beginning') {
            const order_status_payment_history: any[] = [
                {
                    payment_method: 'tien_mat',
                    amount_paid: totalPriceAfterDiscount
                }
            ]
            for (let i = 0; i < order_status_payment_history.length; i++) {
                order_status_payment_history[i].seller_id = model.seller_id;
                let statusPaymentModel: PurchaseOrderStatusPaymentModel = {
                    user_id: model.created_id,
                    order_id: (result as RowDataPacket).insertId,
                    amount_paid: order_status_payment_history[i].amount_paid,
                    seller_id: model.seller_id,
                    created_at: create_at,
                    payment_method: order_status_payment_history[i].payment_method,
                    payment_date: order_status_payment_history[i].payment_date,
                    status: order_status_payment_history[i].status
                }
                await this.purchaseOrderStatusPaymentService.create(statusPaymentModel);
            }
            const order_status_history: any[] = [
                {
                    status: StatusOrder.CREATE_VARIANT
                },
                {
                    status: StatusOrder.COMPLETED
                },
            ]
            for (let i = 0; i < order_status_history.length; i++) {
                order_status_history[i].user_id = model.created_id;
                order_status_history[i].order_id = (result as RowDataPacket).insertId;
                order_status_history[i].status = order_status_history[i].status;
                order_status_history[i].created_at = create_at;
                order_status_history[i].seller_id = model.seller_id;
                order_status_history[i].branch_id = model.branch_id;
                const resultStatusHistory = await this.orderStatusService.create(order_status_history[i]);
                statusLastest = order_status_history[i].status as string;
            }
        }
        else {
            if (model.order_status_history != undefined) {
                for (let i = 0; i < model.order_status_history.length; i++) {
                    model.order_status_history[i].user_id = model.created_id;
                    model.order_status_history[i].order_id = (result as RowDataPacket).insertId;
                    model.order_status_history[i].status = model.order_status_history[i].status;
                    model.order_status_history[i].created_at = create_at;
                    model.order_status_history[i].seller_id = model.seller_id;
                    model.order_status_history[i].branch_id = model.branch_id;
                    await this.orderStatusService.create(model.order_status_history[i]);
                    statusLastest = model.order_status_history[i].status as string;
                }
            }
        }

        // if (model.type == 'import-warehouse-transfer') {
        //     const order_status_payment_history: any[] = [
        //         {
        //             payment_method: 'tien_mat',
        //             amount_paid: 0
        //         }
        //     ]
        //     for (let i = 0; i < order_status_payment_history.length; i++) {
        //         order_status_payment_history[i].seller_id = model.seller_id;
        //         let statusPaymentModel: PurchaseOrderStatusPaymentModel = {
        //             user_id: model.created_id,
        //             order_id: (result as RowDataPacket).insertId,
        //             amount_paid: 0,
        //             seller_id: model.seller_id,
        //             created_at: create_at,
        //             payment_method: order_status_payment_history[i].payment_method,
        //             payment_date: order_status_payment_history[i].payment_date,
        //             status: order_status_payment_history[i].status
        //         }
        //         await this.purchaseOrderStatusPaymentService.create(statusPaymentModel);
        //     }   
        // }

        //update status
        let statusUpdate = statusLastest
        if (model.order_status_payment_history && model.order_status_payment_history.length > 0) {
            //console.log(model.order_status_history)
            //console.log(totalPriceAfterDiscount === model.order_status_payment_history[0].amount_paid, model.order_status_history && model.order_status_history[model.order_status_history.length - 1].status)
            if (totalPriceAfterDiscount === model.order_status_payment_history[0].amount_paid && model.order_status_history && model.order_status_history[model.order_status_history.length - 1].status === StatusOrder.IMPORT) {
                statusUpdate = StatusOrder.COMPLETED
                const purchase_order_status_history_model: PurchaseStatusHistoryModel = {
                    order_id: order_id,
                    status: statusUpdate,
                    user_id: model.created_id,
                    seller_id: model.seller_id,
                    branch_id: model.branch_id
                }
                await this.purchaseStatusHistoryService.create(purchase_order_status_history_model)
            }
        }
        let queryUpdateStatus = `update ${this.tableName} set status = ? where id = ?`
        const valuesUpdateStatus = [statusUpdate, order_id]
        await database.executeQuery(queryUpdateStatus, valuesUpdateStatus);

        // thêm vào kho
        if (statusUpdate === StatusOrder.COMPLETED || statusUpdate === StatusOrder.IMPORT) {
            await this.addToWarehouse(order_id)
        }



        return {
            data: {
                id: order_id,
                code: code,
                ...model,
                order_detail: (orderDetailResult as any),
                // status: statusLastest,
                status_name: convertPushlishNumberToOrderStatus(model.status as string),
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

    public searchs = async (key: string, name: string, phone: string, page: number | undefined, limit: number | undefined, created_id: number, fromDate: string, toDate: string, status: number, date: string, status_payment: number, isFilter: boolean, employee_id: number, transaction?: boolean) => {
        if (date != undefined && fromDate == undefined && toDate == undefined) {
            fromDate = date + ' 00:00:00'
            toDate = date + ' 23:59:59'
        }
        if (fromDate != undefined && toDate != undefined) {
            fromDate = Time.addTimeIfMissing(fromDate, '00:00:00');
            toDate = Time.addTimeIfMissing(toDate, '23:59:59');
        }
        let query = `
            select o.* , sp.name as supplier_name, bch.name as branch_name from ${this.tableName} o 
            join (select order_id, status, created_at, row_number() 
                over (partition by order_id order by created_at desc) as rn from purchase_order_status_history ) 
                os on o.id = os.order_id 
            left join supplier sp on sp.id = o.supplier_id 
            left join branch bch on bch.id = o.branch_id  
            where 1=1
         ${fromDate ? 'and o.created_at >= ?' : ''} ${toDate ? 'and o.created_at <= ?' : ''} and os.rn = 1 and 1 = 1`;
        const queryParams: any[] = [];
        if (fromDate !== undefined) {
            queryParams.push(fromDate);
        }
        if (toDate !== undefined) {
            queryParams.push(toDate);
        }
        if (key != undefined) {
            query += ` and ( o.code like ? ) `;
            queryParams.push(`%${key}%`);
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
        if (status_payment != undefined) {
            query += ` and o.status_payment = ?`;
            queryParams.push(status_payment);
        }
        //order khac status 5 va 6
        if (transaction == true) {
            query += ` and o.status != 'hoan_thanh'`;
        }
        query += ` order by o.id desc`;
        //console.log(query)

        const resultNotPagination = await database.executeQuery(query, queryParams);
        if (Array.isArray(resultNotPagination) && resultNotPagination.length === 0) { }
        const listStatus: IReportStatus[] = [
            { status: 1, total_orders: 0 },
            { status: 2, total_orders: 0 },
            { status: 3, total_orders: 0 },
            { status: 4, total_orders: 0 },
        ]
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
                    const product = await findById((result as any)[i].order_detail[j].product_id);
                    if (!(product instanceof Error)) {
                        const images = (product as any).data.images || null;
                        const name = (product as any).data.name;
                        const productCode = (product as any).data.code;
                        (result as any)[i].order_detail[j].name = name;
                        (result as any)[i].order_detail[j].code = productCode;
                        (result as any)[i].order_detail[j].image_thumbnail = images ? images[0].image_thumbnail : null;
                    }
                    const calcPrice: ICalculateOrder = {
                        price: (result as any)[i].order_detail[j].price,
                        quantity: (result as any)[i].order_detail[j].quantity,
                        discount_value: (result as any)[i].order_detail[j].discount_value,
                        discount_type: (result as any)[i].order_detail[j].discount_type
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
                    // (result as RowDataPacket)[i].status_payment_name = convertOrderStatusPayment((result as RowDataPacket)[i].status_payment);

                    // (result as any)[i].pay_method_name = this.convertPaymentMethod((result as any)[i].pay_method);
                    // (result as any)[i].ship_method_name = this.convertShipMethod((result as any)[i].ship_method);
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
                //console.log(result)

                const total = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalPrice, 0);
                (result as any)[i].totalPrice = total;

                const totalDiscount = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalDiscount, 0);
                (result as any)[i].totalDiscount = totalDiscount;

                const totalPriceAfterDiscount = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalPriceAfterDiscount, 0);
                (result as any)[i].totalPriceAfterDiscount = totalPriceAfterDiscount;
            }

            // if (key != undefined && key != '') {
            // (result as RowDataPacket).map((item: any) => {
            //     item.order_detail = item.order_detail.filter((order: any) => {
            //         if(order.name != null && order.code != null){
            //             return order.name.toLowerCase().includes(key.toLowerCase()) || order.code.toLowerCase().includes(key.toLowerCase());
            //         }
            //     })
            // })
            // }

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
            //console.log(result)
            return {
                data: result,
                pagination: pagination,
                listStatus: listStatus
            };

        } catch (error) {
            return new HttpException(500, errorMessages.FAILED);
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
        //console.log("update")
        let check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(400, errorMessages.NOT_FOUND, 'id');
        if (model.status == StatusOrder.COMPLETED && check[0].status == StatusOrder.IMPORT || check[0].status == StatusOrder.COMPLETED)
            return new HttpException(400, errorMessages.ORDER_STATUS_NOT_ALLOW, 'status');
        let query = `update ${this.tableName} set`;
        const values = []
        // if (model.pay_method != undefined) {
        //     query += ' pay_method = ?,'
        //     values.push(model.pay_method)
        // }
        // if (model.ship_method != undefined) {
        //     query += ' ship_method = ?,'
        //     values.push(model.ship_method)
        // }
        if (model.note != undefined) {
            query += ' note = ?,'
            values.push(model.note)
        }
        if (model.branch_id != undefined) {
            query += ' branch_id = ?,'
            values.push(model.branch_id)
        }
        if (model.status && (model.status == true || model.status == StatusOrder.COMPLETED)) {
            let resultStatus;
            let check = await this.orderStatusService.findAllOrderStatusByOrderId(id)
            if (Array.isArray((check as RowDataPacket).data) && (check as RowDataPacket).data.length > 0 && ((check as RowDataPacket).data[0].status == StatusOrder.IMPORT || (check as RowDataPacket).data[0].status == StatusOrder.COMPLETED)) {
                return new HttpException(400, errorMessages.ORDER_STATUS_NOT_ALLOW, 'status');
            }
            if (model.status == StatusOrder.COMPLETED) {
                resultStatus = await this.orderStatusService.updateOrderStatus(id, model.created_id as number, StatusOrder.COMPLETED)
            } else {
                resultStatus = await this.orderStatusService.updateOrderStatus(id, model.created_id as number)
            }
            if (resultStatus instanceof Error) {
                return new HttpException(400, errorMessages.UPDATE_STATUS_FAILED, 'status');
            }
            else {
                query += ' status = ?,'
                values.push((resultStatus as RowDataPacket).data.status)
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
                // processing_at: check[0].processing_at,
                // delivering_at: check[0].delivering_at,
                imported_at: check[0].imported_at,
                completed_at: check[0].completed_at,
                canceled_at: check[0].canceled_at
            }
        }
    }

    public report = async (fromDate: string, toDate: string, date: string, created_id: number, seller_id: number) => {
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
                }
            ]
        }
    }

    public reportOrderByFomDateToDate = async (fromDate: string, toDate: string, status: number) => {
        let query = `select o.*, os.status as latest_status, os.created_at as status_date from orders o join (select order_id, status, created_at, row_number() over (partition by order_id order by created_at desc) as rn from purchase_order_status_history where created_at between ? and ?) os on o.id = os.order_id where os.rn = 1`;
        const values = [fromDate, toDate];
        const result = await database.executeQuery(query, values);
        if (Array.isArray(result) && result.length === 0) {
            return new HttpException(404, errorMessages.NOT_FOUND);
        }
        return {
            data: result
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
    public reportSaleInvoice = async (id: number) => {
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
                const product = await findById((result as any)[i].order_detail[j].product_id)
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
                const calcPrice: ICalculateOrder = {
                    price: (result as any)[i].order_detail[j].price,
                    quantity: (result as any)[i].order_detail[j].quantity,
                    discount_value: (result as any)[i].order_detail[j].discount_value,
                    discount_type: (result as any)[i].order_detail[j].discount_type
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
            // (result as any)[i].pay_method_name = this.convertPaymentMethod((result as any)[i].pay_method);
            // (result as any)[i].ship_method_name = this.convertShipMethod((result as any)[i].ship_method);

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

    public exportListPDFInvoice = async (listId: number[]) => {
        let listInvoice = []
        for (let i = 0; i < listId.length; i++) {
            const result = await this.reportSaleInvoice(listId[i])
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
        //console.log("update status")

        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(400, errorMessages.NOT_FOUND, 'id');
        let query = `update ${this.tableName} set status = ? where id = ?`
        const result = await database.executeQuery(query, [model.status, id]);
        if (model.status === StatusOrder.COMPLETED) {
            await this.addToWarehouse(id)
        }
        const updateOrderStatus = await this.orderStatusService.updateOrderStatusByStatus(id, model.created_id as number, model.status as string)
        //log
        database.log({
            user_id: model.created_id!,
            module_id: 23,
            action: errorMessages.UPDATE,
            // des: `Cập nhật trạng thái đơn hàng ${id} thành ${convertPushlishNumberToOrderStatus(model.status as number)}`
            des: { id: id, status: model.status }
        })
        return {
            data: {
                id: id,
                status: model.status,
                status_name: convertPushlishNumberToOrderStatus(model.status as string),
                updated_at: new Date()
            }
        }
    }
    public updateStatusUpdate = async (id: number, model: CreateDto) => {
        //console.log("update status update")

        const checkList = await checkExist(this.tableName, 'id', id.toString());
        // if ((checkExist as RowDataPacket)[0].status != ) {
        if (checkList == false) {
        } else if (model.status != undefined) {
            //check status hop le
            // let statusCurrent = (checkList as RowDataPacket)[0].status
            // if (statusCurrent + 1 != model.status && model.status != 4) {
            //     return new HttpException(400, errorMessages.INVALID_STATUS_UPDATE);
            // }
        }
        let check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(400, errorMessages.NOT_FOUND, 'id');
        let query = `update ${this.tableName} set`;
        const values = []
        // if (model.pay_method != undefined) {
        //     query += ' pay_method = ?,'
        //     values.push(model.pay_method)
        // }
        // if (model.ship_method != undefined) {
        //     query += ' ship_method = ?,'
        //     values.push(model.ship_method)
        // }
        if (model.note != undefined) {
            query += ' note = ?,'
            values.push(model.note)
        }
        // if (model.status_payment != undefined) {
        //     query += ' status_payment = ?,'
        //     values.push(model.status_payment)
        // }
        if (model.delivery_date != undefined) {
            query += ' delivery_date = ?,'
            values.push(model.delivery_date)
        }
        let resultStatus;
        let checkStatus = await this.orderStatusService.findAllOrderStatusByOrderId(id)
        // const satusPayment = check[0].status_payment
        if (model.status != undefined) {
            //da chinh status
            if ((checkStatus as RowDataPacket).data[0].status == StatusOrder.COMPLETED || (checkStatus as RowDataPacket).data[0].status == StatusOrder.CANCEL) {
                return new HttpException(400, errorMessages.ORDER_STATUS_NOT_ALLOW, 'status');
            }
            // check lai status status_payment
            // if (((checkStatus as RowDataPacket).data[0].status == StatusOrder.IMPORT && (satusPayment == 0 || satusPayment == null || satusPayment == 2 && model.status == StatusOrder.COMPLETED)) && model.status != StatusOrder.CANCEL) {
            //     return new HttpException(400, errorMessages.ORDER_STASTUS_NOT_PAYMENT, 'status_payment');
            // }
            resultStatus = await this.orderStatusService.updateOrderStatusUpdate(id, model.created_id as number, model.status as string)
            if (resultStatus instanceof Error) {
                return new HttpException(400, errorMessages.UPDATE_STATUS_FAILED, 'status');
            }
            else {
                query += ' status = ?,'
                values.push((resultStatus as RowDataPacket).data.status)
                const checkOrder = await this.orderDetailService.findAllOrderDetailByOrderId(id)
            }
        }
        const update_at = new Date()
        query += `  updated_at = ? where id = ?`
        values.push(update_at)
        values.push(id)
        const result = await database.executeQuery(query, values)

        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        return {
            data: {
                id: id,
                ...model,
                updated_at: update_at,
                created_at: check[0].created_at,
                imported_at: check[0].imported_at,
                // packing_at: check[0].packing_at,
                // processing_at: check[0].processing_at,
                // delivering_at: check[0].delivering_at,
                completed_at: check[0].completed_at,
                canceled_at: check[0].canceled_at,
            }
        }
    }
    public reportDelivery = async (key: string, name: string, phone: string, page: number, limit: number, created_id: number, fromDate: string, toDate: string, status: number, date: string, listId: number[], status_payment: number, isFilter: boolean, employee_id: number) => {
        const getAllOrder = await this.searchs(key, name, phone, page, limit, created_id, fromDate, toDate, status, date, status_payment, isFilter, employee_id)
        //console.log("getAllOrder", getAllOrder);

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
    // public updateOrder = async (id: number, model: CreateDto) => {
    //     const check = await checkExist(this.tableName, 'id', id.toString());
    //     if (check == false)
    //         return new HttpException(400, errorMessages.NOT_FOUND, 'id');
    //     const checkStatus = await CheckOrder.checkOrderCompletedOrCanceled(check[0].status);
    //     if ((checkStatus as RowDataPacket).result == true && (checkStatus as RowDataPacket).status == 3) {
    //         return new HttpException(400, errorMessages.ORDER_COMPLETED, 'status');
    //     }
    //     if ((checkStatus as RowDataPacket).result == true && (checkStatus as RowDataPacket).status == 4) {
    //         return new HttpException(400, errorMessages.ORDER_CANCELED, 'status');
    //     }
    //     let query = `update ${this.tableName} set`;
    //     const values = []
    //     if (model.supplier_id != undefined) {
    //         query += ' supplier_id = ?,'
    //         values.push(model.supplier_id)
    //     }
    //     if (model.note != undefined) {
    //         query += ' note = ?,'
    //         values.push(model.note)
    //     }
    //     // if (model.pay_method != undefined) {
    //     //     query += ' pay_method = ?,'
    //     //     values.push(model.pay_method)
    //     // }
    //     // if (model.ship_method != undefined) {
    //     //     query += ' ship_method = ?,'
    //     //     values.push(model.ship_method)
    //     // }
    //     if (model.branch_id != undefined) {
    //         query += ' branch_id = ?,'
    //         values.push(model.branch_id)
    //     }
    //     if (model.delivery_date != undefined) {
    //         query += ' delivery_date = ?,'
    //         values.push(model.delivery_date)
    //     }
    //     if (model.order_details != undefined) {
    //         //console.log(model.order_details);
    //         const findAllOrderDetailByOrderId = await this.orderDetailService.findAllOrderDetailByOrderId(id)
    //         if (findAllOrderDetailByOrderId instanceof Error && model.order_details.length > 0) {
    //             // return new HttpException(400, errorMessages.NOT_FOUND, 'id');
    //             for (let i = 0; i < model.order_details.length; i++) {
    //                 model.order_details[i].order_id = id
    //                 const result = await this.orderDetailService.create(model.order_details[i])
    //                 if (result instanceof Error) {
    //                     return new HttpException(400, errorMessages.CREATE_FAILED, 'order_detail');
    //                 }
    //             }
    //         } else {
    //             for (let i = 0; i < (findAllOrderDetailByOrderId as any).data.length; i++) {
    //                 const result = await this.orderDetailService.delete((findAllOrderDetailByOrderId as any).data[i].id)
    //                 if (result instanceof Error) {
    //                     return new HttpException(400, errorMessages.DELETE_FAILED, 'order_detail');
    //                 }
    //             }
    //             for (let i = 0; i < model.order_details.length; i++) {
    //                 model.order_details[i].order_id = id
    //                 const result = await this.orderDetailService.create(model.order_details[i])
    //                 if (result instanceof Error) {
    //                     return new HttpException(400, errorMessages.CREATE_FAILED, 'order_detail');
    //                 }
    //             }
    //         }
    //     }
    //     query += ` updated_at = ? where id = ?`
    //     const update_at = new Date()
    //     values.push(update_at)
    //     values.push(id)
    //     const result = await database.executeQuery(query, values);
    //     if ((result as any).affectedRows === 0)
    //         return new HttpException(400, errorMessages.UPDATE_FAILED);
    //     return {
    //         data: {
    //             id: id,
    //             ...model,
    //             updated_at: update_at
    //         }
    //     }

    // }

    // public updateListStatusPayment = async (listId: number[], statusPayment: string) => {
    //     const listResponse = []
    //     for (let i = 0; i < listId.length; i++) {
    //         const resultUpdateStatus = await this.updateStatusUpdate(listId[i], { status_payment: statusPayment, created_id: 1 })
    //         if (resultUpdateStatus instanceof Error) {
    //         } else {
    //             //them
    //             //cap nhat status = 3
    //             try {
    //                 await this.updateListStatus([listId[i]], StatusOrder.COMPLETED)
    //             } catch (error) {
    //             }
    //         }

    //         if (resultUpdateStatus instanceof Error) {
    //             // return new HttpException(400, errorMessages.UPDATE_STATUS_FAILED, 'status');
    //         }
    //         if ((resultUpdateStatus as RowDataPacket).data != undefined) {
    //             listResponse.push((resultUpdateStatus as RowDataPacket).data)
    //         }
    //     }
    //     return {
    //         data: listResponse
    //     }
    // }
    private calcTotalPrice = (model: ICalculateOrder) => {
        let totalPrice = 0;
        let totalPriceAfterDiscount = 0;
        let totalDiscount = 0;
        const { price, quantity, discount_type, discount_value } = model;

        if (price && quantity) {
            totalPrice = price * quantity
        }

        if (discount_type == 1 && price && quantity && discount_value) {
            totalDiscount = totalPrice * discount_value / 100
            totalPriceAfterDiscount = totalPrice - totalDiscount;
            // totalPriceAfterDiscount = (price - price * discount_value / 100) * quantity;
        } else if (discount_type == 2 && price && quantity && discount_value) {
            totalDiscount = 1 * discount_value;
            totalPriceAfterDiscount = totalPrice - totalDiscount;
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
    public findAllByCreatedId = async (key: string, name: string, phone: string, page: number | undefined, limit: number | undefined, created_id: number, fromDate: string, toDate: string, status: number, date: string) => {
        if (date !== undefined && fromDate == undefined && toDate == undefined) {
            fromDate = date + ' 00:00:00'
            toDate = date + ' 23:59:59'
        }
        if (fromDate != undefined && toDate != undefined) {
            fromDate = Time.addTimeIfMissing(fromDate, '00:00:00');
            toDate = Time.addTimeIfMissing(toDate, '23:59:59');
        }
        let query = ` select o.*, ct.name as city_name, dt.name as district_name, wd.name as ward_name, os.completed_date from orders o  join ( select order_id, created_at as completed_date, row_number() over (partition by order_id order by created_at desc) as rn from purchase_order_status_history where status = 5 ) os on o.id = os.order_id left join city ct on ct.id = o.city_id left join district dt on dt.id = o.district_id left join ward wd on wd.id = o.ward_id where 1=1  and os.rn = 1 ${fromDate && toDate ? 'and os.completed_date >= ? and os.completed_date <= ?' : ''} and 1=1 `;
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
                    const product = await findById((result as any)[i].order_detail[j].product_id);
                    if (!(product instanceof Error)) {
                        const images = (product as any).data.images || null;
                        const name = (product as any).data.name;
                        const productCode = (product as any).data.code;
                        (result as any)[i].order_detail[j].name = name;
                        (result as any)[i].order_detail[j].code = productCode;
                        (result as any)[i].order_detail[j].image_thumbnail = images ? images[0].image_thumbnail : null;
                    }
                    const calcPrice: ICalculateOrder = {
                        price: (result as any)[i].order_detail[j].price,
                        quantity: (result as any)[i].order_detail[j].quantity,
                        discount_value: (result as any)[i].order_detail[j].discount_value,
                        discount_type: (result as any)[i].order_detail[j].discount_type
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

                    // (result as any)[i].pay_method_name = this.convertPaymentMethod((result as any)[i].pay_method);
                    // (result as any)[i].ship_method_name = this.convertShipMethod((result as any)[i].ship_method);
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
    public findAllCommissionByCreatedId = async (key: string, name: string, phone: string, page: number, limit: number, created_id: number, fromDate: string, toDate: string, status: number, date: string) => {
        const pageDefault = undefined;
        const limitDefaul = undefined;
        // if(!fromDate || !toDate) {}
        // status = 5: đã hoàn thành
        const getOrderByCreatedId = await this.findAllByCreatedId(key, name, phone, pageDefault, limitDefaul, created_id, fromDate, toDate, 5, date);
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
                    if (detail.discount_value > detail.price * detail.quantity) {
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
        if (date != undefined && fromDate == undefined && toDate == undefined) {
            fromDate = date + ' 00:00:00'
            toDate = date + ' 23:59:59'
        }
        if (fromDate != undefined && toDate != undefined) {
            fromDate = Time.addTimeIfMissing(fromDate, '00:00:00');
            toDate = Time.addTimeIfMissing(toDate, '23:59:59');
        }
        let query = `select o.* , ct.name as city_name, dt.name as district_name, wd.name as ward_name from ${this.tableName} o join (select order_id, status, created_at, row_number() over (partition by order_id order by created_at desc) as rn from purchase_order_status_history ) os 
         on o.id = os.order_id left join city ct on ct.id = o.city_id  left join district dt on dt.id = o.district_id left join ward wd on wd.id = o.ward_id where 1=1
         ${fromDate ? 'and o.created_at >= ?' : ''} ${toDate ? 'and o.created_at <= ?' : ''} and os.rn = 1 and 1 = 1`;
        const queryParams: any[] = [];
        if (fromDate !== undefined) {
            queryParams.push(fromDate);
        }
        if (toDate !== undefined) {
            queryParams.push(toDate);
        }
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
        // if (status_payment != undefined) {
        //     query += ` and o.status_payment = ?`;
        //     queryParams.push(status_payment);
        // }
        //order khac status 5 va 6
        if (transaction == true) {
            query += ` and o.status != 3 and o.status != 4`;
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
                    const product = await findById((result as any)[i].order_detail[j].product_id);
                    if (!(product instanceof Error)) {
                        const images = (product as any).data.images || null;
                        const name = (product as any).data.name;
                        const productCode = (product as any).data.code;
                        (result as any)[i].order_detail[j].name = name;
                        (result as any)[i].order_detail[j].code = productCode;
                        (result as any)[i].order_detail[j].image_thumbnail = images ? images[0].image_thumbnail : null;
                    }
                    const calcPrice: ICalculateOrder = {
                        price: (result as any)[i].order_detail[j].price,
                        quantity: (result as any)[i].order_detail[j].quantity,
                        discount_value: (result as any)[i].order_detail[j].discount_value,
                        discount_type: (result as any)[i].order_detail[j].discount_type
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
                    // (result as RowDataPacket)[i].status_payment_name = convertOrderStatusPayment((result as RowDataPacket)[i].status_payment);

                    // (result as any)[i].pay_method_name = this.convertPaymentMethod((result as any)[i].pay_method);
                    // (result as any)[i].ship_method_name = this.convertShipMethod((result as any)[i].ship_method);
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
            // { status: 5, total_orders: 0 },
            // { status: 6, total_orders: 0 },
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
    public reportRevenueMonthOfYear = async (created_id: number) => {
        let query = '';
        let params: any = [];
        if (created_id == 1) {
            query = ` select month(osh.created_at) as month, sum(od.quantity * od.price) as amount  from orders o join order_detail od on o.id = od.order_id  join purchase_order_status_history osh on o.id = osh.order_id where  osh.status = 5 and year(osh.created_at) = year(current_date) group by month(osh.created_at) order by month(osh.created_at)`;
        }
        else {
            query = `select month(osh.created_at) as month, sum(od.quantity * od.price) as amount  from orders o join order_detail od on o.id = od.order_id  join purchase_order_status_history osh on o.id = osh.order_id where o.created_id = ? and  osh.status = 5 and year(osh.created_at) = year(current_date) group by month(osh.created_at) order by month(osh.created_at)`;
            params = [created_id];
        }
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

    public searchPurchase = async (key: string, name: string, phone: string, page: number | undefined, limit: number | undefined, created_id: number, fromDate: string, toDate: string, status: number, date: string, status_payment: number, isFilter: boolean, employee_id: number, seller_id: number, transaction?: boolean) => {
        const user = await database.executeQuery(`SELECT created_id from users where id = ?`, [created_id]) as RowDataPacket
        const employee_branch = await database.executeQuery(`SELECT branch_id from employee_branch where user_id = ?`, [created_id]) as RowDataPacket
        console.log(employee_branch, created_id)
        if (user[0].created_id > 0) {
            created_id = user[0].created_id
        }
        //console.log(created_id)
        if (date != undefined && fromDate == undefined && toDate == undefined) {
            fromDate = date + ' 00:00:00'
            toDate = date + ' 23:59:59'
        }
        if (fromDate != undefined && toDate != undefined) {
            fromDate = Time.addTimeIfMissing(fromDate, '00:00:00');
            toDate = Time.addTimeIfMissing(toDate, '23:59:59');
        }
        let query = `
            SELECT 
            o.*, 
            CASE 
                WHEN o.status = 'cho_duyet' THEN 'Chờ duyệt'
                WHEN o.status = 'cho_xac_nhan' THEN 'Chờ xác nhận'
                WHEN o.status = 'cho_nhap_kho' THEN 'Chờ nhập kho'
                WHEN o.status = 'da_nhap_kho' THEN 'Đã nhập kho'
                WHEN o.status = 'hoan_thanh' THEN 'Hoàn thành'
                WHEN o.status = 'huy' THEN 'Đã hủy'
                WHEN o.status = 'khong_duoc_duyet' THEN 'Không được duyệt'
                WHEN o.status = 'khong_xac_nhan' THEN 'Không xác nhận'
            END AS status_name,
            sp.name AS supplier_name, 
            bch.name AS branch_name, 
            CONCAT(u.name, ' ', u.phone) AS created_name, 
            u.name AS employee_name,

            COALESCE(pod_summary.order_detail, '[]') AS order_detail,
            COALESCE(posh_summary.order_status_history, '[]') AS order_status_history,
            COALESCE(psph_summary.order_status_payment_history, '[]') AS order_status_payment_history,
            CASE 
                WHEN o.type = 'import-warehouse-transfer' THEN 'Nhập kho chuyển'
                WHEN o.type = 'import-warehouse-beginning' THEN 'Nhập kho đầu kỳ'
                WHEN o.type = 'import-warehouse-buy' THEN 'Nhập kho mua' 
            END AS type,
            CASE 
                WHEN o.type = 'import-warehouse-transfer' THEN 0 
                ELSE COALESCE(pod_summary.totalPrice, 0)  
            END AS totalPrice,

            CASE 
                WHEN o.type = 'import-warehouse-transfer' THEN 0 
                ELSE COALESCE(pod_summary.totalPriceAfterDiscount, 0) 
            END AS totalPriceAfterDiscount,

            CASE 
                WHEN o.type = 'import-warehouse-transfer' THEN 0 
                ELSE COALESCE(pod_summary.totalDiscount, 0)
            END AS totalDiscount,
            
            CASE 
                WHEN o.type = 'import-warehouse-transfer' THEN 0 
                ELSE COALESCE(psph_summary.total_amount_paid, 0)
            END AS total_amount_paid,

            CASE 
                WHEN o.type = 'import-warehouse-transfer' THEN 0 
                ELSE COALESCE(pod_summary.totalPriceAfterDiscount, 0) - COALESCE(psph_summary.total_amount_paid, 0)
            END  AS debt

            FROM purchase_order o
            LEFT JOIN supplier sp ON sp.id = o.supplier_id
            LEFT JOIN branch bch ON bch.id = o.branch_id
            LEFT JOIN users u ON o.created_id = u.id

            LEFT JOIN (
            SELECT 
            pod.order_id,
            JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', pod.id,
                'product_id', pod.product_id,
                'quantity', pod.quantity,
                'price', pod.price,
                'discount_value', pod.discount_value,
                'discount_type', pod.discount_type,
                'seller_id', pod.seller_id,
                'prime_cost', pod.prime_cost,
                'inventory', pod.inventory,
                'unit_id', pu.id,
                'unit_name', pu.name,
                'name', p.name,
                'code', p.code,
                'image_thumbnail', IFNULL(CONCAT('uploads/', p.code, '/thumbnail/', pi.image), NULL),
                'discount_type_name', IF(pod.discount_type = 1, "%", IF(pod.discount_type = 0, "Không có", "Tiền mặt")),
                'totalPrice', pod.quantity * pod.prime_cost,
                'totalPriceAfterDiscount', 
                    IF(pod.discount_type = 1, pod.quantity * pod.prime_cost * (1 - pod.discount_value / 100), 
                                        pod.quantity * pod.prime_cost - pod.discount_value),
                'totalDiscount', 
                    IF(pod.discount_type = 1, pod.quantity * pod.prime_cost * pod.discount_value / 100, 
                                        pod.discount_value)
            )
            ) AS order_detail,
            SUM(pod.quantity * pod.prime_cost) AS totalPrice,
            SUM(
            IF(pod.discount_type = 1, pod.quantity * pod.prime_cost * (1 - pod.discount_value / 100), 
                                    pod.quantity * pod.prime_cost - pod.discount_value)
            ) AS totalPriceAfterDiscount,
            SUM(pod.quantity * pod.prime_cost) - SUM(
            IF(pod.discount_type = 1, pod.quantity * pod.prime_cost * (1 - pod.discount_value / 100), 
                                    pod.quantity * pod.prime_cost - pod.discount_value)
            ) AS totalDiscount
            FROM purchase_order_detail pod
            LEFT JOIN product p ON pod.product_id = p.id
            LEFT JOIN product_unit pu ON pu.id = p.unit_id
            LEFT JOIN (
            SELECT product_id, MIN(image) AS image
            FROM product_image 
            GROUP BY product_id
            ) pi ON pi.product_id = p.id
            GROUP BY pod.order_id
            ) pod_summary ON pod_summary.order_id = o.id

            -- Tổng hợp lịch sử trạng thái đơn hàng
            LEFT JOIN (
            SELECT 
            posh.order_id,
            JSON_ARRAYAGG(
            JSON_OBJECT
                (
                    'id', posh.id,
                    'status', posh.status,
                    'created_at', posh.created_at,
                    'seller_id', posh.seller_id,
                    'status_name', 
                        CASE 
                            WHEN posh.status = "cho_duyet" THEN 'Tạo đơn' 
                            WHEN posh.status = "nhap_hang" THEN 'Nhập hàng'
                            WHEN posh.status = "hoan_thanh" THEN 'Hoàn thành'
                            ELSE 'Nhập kho đầu kỳ'
                        END
                )
            ) AS order_status_history
            FROM purchase_order_status_history posh
            GROUP BY posh.order_id
            ) posh_summary ON posh_summary.order_id = o.id

            -- Tổng hợp lịch sử thanh toán
            LEFT JOIN (
            SELECT 
            psph.order_id,
            JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', psph.id,
                'amount_paid', psph.amount_paid,
                'payment_method', psph.payment_method,
                'payment_date', psph.payment_date,
                'created_at', psph.created_at,
                'updated_at', psph.updated_at
            )
            ) AS order_status_payment_history,
            SUM(psph.amount_paid) AS total_amount_paid
            FROM purchase_status_payment_history psph
            GROUP BY psph.order_id
            ) psph_summary ON psph_summary.order_id = o.id

            WHERE 1=1
            ${fromDate ? 'and o.created_at >= ?' : ''} ${toDate ? 'and o.created_at <= ?' : ''} and 1 = 1`;
        const queryParams: any[] = [];
        if (fromDate !== undefined) {
            queryParams.push(fromDate);
        }
        if (toDate !== undefined) {
            queryParams.push(toDate);
        }
        if (key != undefined) {
            query += ` and ( o.code like ? ) `;
            queryParams.push(`%${key}%`);
        }
        if (seller_id !== undefined) {
            query += ` and o.seller_id = ?`;
            queryParams.push(seller_id);
        }
        if (employee_branch.length > 0) {
            const branch_id = employee_branch.map((item: any) => item.branch_id)
            if (!branch_id.includes(0)) {
                query += ` and o.branch_id in (${branch_id}) OR o.from_branch_id in (${branch_id})`;
            }
        }
        // if (created_id !== undefined && created_id != 1) {
        //     query += ` and o.created_id = ?`;
        //     queryParams.push(created_id);
        // }

        // if (isFilter == true && employee_id != undefined) {
        //     query += ` and o.created_id = ?`;
        //     queryParams.push(employee_id);
        // }
        if (status != undefined) {
            query += ` and o.status = ?`;
            queryParams.push(status);
        }
        // if (status_payment != undefined) {
        //     query += ` and o.status_payment = ?`;
        //     queryParams.push(status_payment);
        // }
        //order khac status 5 va 6
        if (transaction == true) {
            query += ` and o.status != 'hoan_thanh'`;
        }
        query += ` group by o.id order by o.id desc`;

        const resultNotPagination = await database.executeQuery(query, queryParams);
        if (Array.isArray(resultNotPagination) && resultNotPagination.length === 0) { }
        const listStatus: IReportStatus[] = [
            { status: 1, total_orders: 0 },
            { status: 2, total_orders: 0 },
            { status: 3, total_orders: 0 },
            { status: 4, total_orders: 0 },
        ]

        const count = await database.executeQuery(query, queryParams);
        if (page && page < 1 || page && limit! < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (page && limit)
            query = query + ` LIMIT ` + limit + ` OFFSET ` + (page - 1) * limit;
        try {
            const result = await database.executeQuery(query, queryParams) as RowDataPacket;
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
            return {
                data: result.map((item: any) => {
                    return {
                        ...item,
                        order_detail: JSON.parse(item.order_detail),
                        order_status_history: JSON.parse(item.order_status_history),
                        order_status_payment_history: JSON.parse(item.order_status_payment_history)
                    }
                }),
                pagination: pagination,
                listStatus: listStatus
            };

        } catch (error) {
            return new HttpException(500, errorMessages.FAILED);
        }
    }

    public updateOrder = async (id: number, model: CreateDto) => {
        const orderType = await database.executeQuery(`select type from purchase_order where id = ${id}`) as RowDataPacket
        const purchase_status_payment_history = await this.purchaseOrderStatusPaymentService.findAllOrderStatusByOrderId(id) as any;
        console.log('purchase_status_payment_history', purchase_status_payment_history) 
        if (purchase_status_payment_history instanceof Error || orderType[0].type == 'import-warehouse-transfer') {
            const check = await checkExist(this.tableName, 'id', id.toString());
            if (check == false)
                return new HttpException(400, errorMessages.NOT_FOUND, 'id');
            const checkStatus = await CheckOrder.checkOrderCompletedOrCanceled(check[0].status);
            if ((checkStatus as RowDataPacket).result == true && (checkStatus as RowDataPacket).status == StatusOrder.COMPLETED) {
                return new HttpException(400, errorMessages.ORDER_COMPLETED, 'status');
            }
            if ((checkStatus as RowDataPacket).result == true && (checkStatus as RowDataPacket).status == StatusOrder.CANCEL) {
                return new HttpException(400, errorMessages.ORDER_CANCELED, 'status');
            }
            console.log('a')
            let query = `update ${this.tableName} set`;
            const values = []
            if (model.supplier_id != undefined) {
                query += ' supplier_id = ?,'
                values.push(model.supplier_id)
            }
            if (model.type != undefined && model.type == 'import-warehouse-transfer') {
                query += ' supplier_id = ?,'
                values.push(0)
            }
            if (model.note != undefined) {
                query += ' note = ?,'
                values.push(model.note)
            }
            if (model.branch_id != undefined) {
                query += ' branch_id = ?,'
                values.push(model.branch_id)
            }
            if (model.type != undefined) {
                query += ' type = ?,'
                values.push(model.type)
            }
            if (model.delivery_date != undefined) {
                if (!moment(model.delivery_date, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
                    const correctedDate = moment(model.delivery_date).format('YYYY-MM-DD HH:mm:ss');
                    model.delivery_date = correctedDate;
                }
                query += ' delivery_date = ?,'
                values.push(model.delivery_date)
            }
            if (model.order_details != undefined && model.order_details.length > 0) {
                console.log(model.order_details)
                const findAllOrderDetailByOrderId = await this.orderDetailService.findAllOrderDetailByOrderId(id)
                if (findAllOrderDetailByOrderId instanceof Error && model.order_details.length > 0) {
                    for (let i = 0; i < model.order_details.length; i++) {
                        model.order_details[i].order_id = id
                        const result = await this.orderDetailService.create(model.order_details[i])
                        if (result instanceof Error) {
                            return new HttpException(400, errorMessages.CREATE_FAILED, 'order_detail');
                        }
                    }
                } else {
                    for (let i = 0; i < (findAllOrderDetailByOrderId as any).data.length; i++) {
                        const result = await this.orderDetailService.delete((findAllOrderDetailByOrderId as any).data[i].id)
                        if (result instanceof Error) {
                            return new HttpException(400, errorMessages.DELETE_FAILED, 'order_detail');
                        }
                    }
                    for (let i = 0; i < model.order_details.length; i++) {
                        model.order_details[i].order_id = id
                        const result = await this.orderDetailService.create(model.order_details[i])
                        if (result instanceof Error) {
                            return new HttpException(400, errorMessages.CREATE_FAILED, 'order_detail');
                        }
                    }
                }
            }
            if (model.order_status_history && model.order_status_history.length > 0) {
                console.log('aaa', model.order_status_history)
                // //check order_status_history
                const checkStatus = await this.orderStatusService.findAllOrderStatusByOrderId(id);
                const currentStatus = (checkStatus as RowDataPacket).data[0].status;
                if (currentStatus == StatusOrder.COMPLETED || currentStatus == StatusOrder.CANCEL) {
                    return new HttpException(400, errorMessages.PURCHASE_STATUS_NOT_ALLOW, 'status');
                }
                console.log(currentStatus, model.order_status_history[model.order_status_history.length - 1].status)
                if (currentStatus == model.order_status_history[model.order_status_history.length - 1].status && currentStatus !== StatusOrder.NEW) {
                    return new HttpException(400, errorMessages.PURCHASE_STATUS_INVALID, 'status');
                }
                for (let i = 0; i < model.order_status_history.length; i++) {
                    const modelStatus: OrderStatus = {
                        order_id: id,
                        status: model.order_status_history[i].status,
                        seller_id: model.seller_id || model.order_status_history[i].seller_id,
                        user_id: model.created_id || model.order_status_history[i].user_id,
                        created_at: model.order_status_history[i].created_at || new Date(),
                        branch_id: check[0].branch_id,  
                        reason: model.order_status_history[i].reason
                    }
                    const result = await this.orderStatusService.create(modelStatus)
                    if (result instanceof Error) {
                        return new HttpException(400, errorMessages.CREATE_FAILED, 'order_status_history');
                    }
                }
                try {
                    let queryStatus = `update ${this.tableName} set status = ? where id = ?`
                    console.log(queryStatus, model.order_status_history, id)
                    const valuesStatus = []
                    valuesStatus.push(model.order_status_history[model.order_status_history.length - 1].status)
                    valuesStatus.push(id)
                    console.log(queryStatus, valuesStatus)
                    await database.executeQuery(queryStatus, valuesStatus);
                    if (model.order_status_history[0].status == StatusOrder.IMPORT) {
                        const test = await this.addToWarehouse(id)
                        //console.log(test, model.order_status_history[0].status, model.order_status_history[0].status == StatusOrder.COMPLETED || model.order_status_history[0].status == StatusOrder.IMPORT, )
                    }
                    // check status payment
                    const getOrder = await this.findById(id);
                    if (getOrder instanceof Error) {
                    }
                    const debt = (getOrder as any).data.debt;
                    if (debt == 0) {
                        const resultStatusComplete = await this.orderStatusService.create({
                            order_id: id,
                            status: StatusOrder.COMPLETED,
                            seller_id: model.order_status_history[model.order_status_history.length - 1].seller_id,
                            user_id: model.order_status_history[model.order_status_history.length - 1].user_id,
                            created_at: new Date(),
                            branch_id: model.order_status_history[model.order_status_history.length - 1].branch_id,
                        })
                        if (resultStatusComplete instanceof Error) {
                            return new HttpException(400, errorMessages.CREATE_FAILED, 'order_status_history');
                        }
                        const updateStatus = await database.executeQuery(`update ${this.tableName} set status = ? where id = ?`, [StatusOrder.COMPLETED, id]);
                        if ((updateStatus as any).affectedRows === 0)
                            return new HttpException(400, errorMessages.UPDATE_FAILED);
                        return {
                            data: {
                                ...resultStatusComplete.data,
                            }
                        }
                    }

                } catch (error) { }
            }
            else {
                const modelStatus: OrderStatus = {
                    order_id: id,
                    status: 'cho_duyet',
                    seller_id: model.seller_id,
                    user_id: model.created_id,
                    created_at: new Date(),
                    branch_id: check[0].branch_id
                }
                const result = await this.orderStatusService.create(modelStatus)
                if (result instanceof Error) {
                    return new HttpException(400, errorMessages.CREATE_FAILED, 'order_status_history');
                }
                const updateStatus = await database.executeQuery(`update ${this.tableName} set status = ? where id = ?`, [StatusOrder.COMPLETED, id]);
                if ((updateStatus as any).affectedRows === 0)
                    return new HttpException(400, errorMessages.UPDATE_FAILED);
                return {
                    data: {
                        ...result.data,
                    }
                }
            }
            if (model.order_status_payment_history != undefined) {
                const getOrder = await this.findById(id);
                if (getOrder instanceof Error) {
                }
                const total_amount_paid = (getOrder as any).data.total_amount_paid;
                let total_amount_paid_model = model.order_status_payment_history.reduce((total: number, item: any) => total + item.amount_paid, 0);
                total_amount_paid_model += total_amount_paid;

                if (total_amount_paid_model < 0 || total_amount_paid_model > (getOrder as any).data.totalPriceAfterDiscount) {
                    return new HttpException(400, errorMessages.PURCHASE_MONEY_INVALID, 'amount_paid');
                }

                if (model.order_status_payment_history.length > 0) {
                    for (let i = 0; i < model.order_status_payment_history.length; i++) {
                        let modelPayment: PurchaseOrderStatusPaymentModel = {
                            order_id: id,
                            status: model.order_status_payment_history[i].status || StatusPaymentDetail.STATUS_PAID,
                            seller_id: model.seller_id,
                            user_id: model.created_id,
                            amount_paid: model.order_status_payment_history[i].amount_paid,
                            payment_method: model.order_status_payment_history[i].payment_method,
                            payment_date: model.order_status_payment_history[i].payment_date || new Date()
                        }
                        const result = await this.purchaseOrderStatusPaymentService.create(modelPayment)
                        // const result = await this.purchaseOrderStatusPaymentService.create(model.order_status_payment_history[i])
                        if (result instanceof Error) {
                            return new HttpException(400, errorMessages.CREATE_FAILED, 'order_status_payment_history');
                        }
                        // total_amount_paid += model.order_status_payment_history[i].amount_paid;
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
            return {
                data: {
                    id: id,
                    ...model,
                    updated_at: update_at

                }
            }
        }
        else {
            console.log('Đơn hàng đã thanh toán không thể chỉnh sửa')   
            return new HttpException(400, 'Đơn hàng đã thanh toán không thể chỉnh sửa');
        }
    }
    public findById = async (id: number, user_id?: number) => {
        const history = await database.executeQuery(`
            select ah.des, ah.created_at, ah.reason, u.name as user_name, po.code as order_code from action_history ah 
            left join users u on u.id = ah.user_id 
            left join purchase_order po on po.id = ah.reference_id
            where ah.reference_id = ? and ah.module_id = 33
            order by ah.created_at asc
        `, [id]) as RowDataPacket;
        let query = `
        select 
        o.*, 
        bch1.name as from_branch_name,
        CASE 
            WHEN o.status = 'cho_duyet' THEN 'Chờ duyệt'
            WHEN o.status = 'cho_xac_nhan' THEN 'Chờ xác nhận'
            WHEN o.status = 'cho_nhap_kho' THEN 'Chờ nhập kho'
            WHEN o.status = 'da_nhap_kho' THEN 'Đã nhập kho'
            WHEN o.status = 'hoan_thanh' THEN 'Hoàn thành'
            WHEN o.status = 'huy' THEN 'Đã hủy'
            WHEN o.status = 'khong_duoc_duyet' THEN 'Không được duyệt'
            WHEN o.status = 'khong_xac_nhan' THEN 'Không xác nhận'
        END AS status_name,
        sp.name as supplier_name, bch.name as branch_name from ${this.tableName} o 
        left join supplier sp on sp.id = o.supplier_id 
        left join branch bch1 on bch1.id = o.from_branch_id
        left join branch bch on bch.id = o.branch_id where o.id = ?`
        const values = [id];
        const resultOrder = await database.executeQuery(query, values);
        //console.log(query, values, resultOrder)
        if (Array.isArray(resultOrder) && resultOrder.length === 0) {
            return new HttpException(404, errorMessages.NOT_FOUND);
        }
        const orderDetail = await this.orderDetailService.findAllOrderDetailByOrderId(id);
        const result = (resultOrder as any);
        (result).forEach(async (element: any) => {
            element.order_detail = (orderDetail as any).data
        })
        console.log(result);
        for (let i = 0; i < (result as any).length; i++) {
            for (let j = 0; j < (result as any)[i].order_detail.length; j++) {
                const product = await findById((result as any)[i].order_detail[j].product_id)
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
                const calcPrice: ICalculateOrder = {
                    price: (result as any)[i].order_detail[j].price,
                    quantity: (result as any)[i].order_detail[j].quantity,
                    discount_value: (result as any)[i].order_detail[j].discount_value,
                    discount_type: (result as any)[i].order_detail[j].discount_type
                };
                result[i].order_detail[j].discount_type_name = this.convertDiscountTypeToName((result as any)[i].order_detail[j].discount_type);
                const calcValue = this.calcTotalPrice(calcPrice);
                result[i].order_detail[j].totalPrice = calcValue.totalPrice;
                result[i].order_detail[j].totalDiscount = calcValue.totalDiscount;
                result[i].order_detail[j].totalPriceAfterDiscount = calcValue.totalPriceAfterDiscount;
                console.log(result[i].from_branch_id, result[i].seller_id)
                const productQuantity = await database.executeQuery(`
                    SELECT IFNULL((
                        SELECT quantity
                        FROM warehouse
                        WHERE product_id = ? AND branch_id = ? AND seller_id = ?
                    ), 0) AS quantity;    
                `, [result[i].order_detail[j].product_id, result[i].from_branch_id, result[i].seller_id]) as RowDataPacket
                if (productQuantity.length > 0) {
                    result[i].order_detail[j].warehouse_quantity = productQuantity[0].quantity
                }
            }
            const totalDiscount = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalDiscount, 0);
            result[i].totalDiscount = totalDiscount;
            const total = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalPrice, 0)
            result[i].totalPrice = total;
            const totalPriceAfterDiscount = (result as any)[i].order_detail.reduce((total: number, item: any) => total + item.totalPriceAfterDiscount, 0)
            result[i].totalPriceAfterDiscount = totalPriceAfterDiscount;
            if ((result as any)[i].created_id && (result as any)[i].created_id != undefined) {
                const checkUserCreate = await checkExist('users', 'id', (result as any)[i].created_id.toString())
                if (checkUserCreate && checkUserCreate[0] != undefined) {
                    (result as any)[i].created_name = checkUserCreate[0].name;
                    (result as any)[i].employee_name = checkUserCreate[0].name;
                }
            }
            const getAllOrderStatusByOrderId = await this.orderStatusService.findAllOrderStatusByOrderId((result as any)[i].id);
            if (getAllOrderStatusByOrderId instanceof Error) {
                (result as RowDataPacket)[i].order_status_history = [];
            } else {
                (result as RowDataPacket)[i].order_status_history = (getAllOrderStatusByOrderId as any).data;
            }
            const getAllOrderStatusPaymentByOrderId = await this.purchaseOrderStatusPaymentService.findAllOrderStatusByOrderId((result as any)[i].id);
            if (getAllOrderStatusPaymentByOrderId instanceof Error) {
                (result as RowDataPacket)[i].order_status_payment_history = [];
            } else {
                (result as RowDataPacket)[i].order_status_payment_history = (getAllOrderStatusPaymentByOrderId as any).data.map((item: any) => { return { ...item, amount_paid: Number(item.amount_paid) } });
            }
            const amout_paid = calculateOrderPaymentStatus((result as RowDataPacket)[i]);
            (result as RowDataPacket)[i].debt = amout_paid.debt;
            (result as RowDataPacket)[i].status_payment = amout_paid.status_payment;
            (result as RowDataPacket)[i].total_amount_paid = amout_paid.total_amount_paid

            // supplier
            const supplier = await this.supplierService.findById((result as any)[i].supplier_id);
            if (supplier instanceof Error) {
            } else {
                (result as any)[i].supplier = (supplier as any).data;
            }
        }
        //console.log(result)
        if (user_id) {  
            const checkBranch = await database.executeQuery(`select branch_id from employee_branch where user_id = ?`, [user_id]) as RowDataPacket
            if (checkBranch.length > 0) {
                (result as any)[0].user_branches = checkBranch.map((item: any) => item.branch_id)
            }
        }
        return {
            data: (result as any)[0],
            action_history: history
        }
    }

    public findByIdUpdate = async (id: number) => {
        const query = `
                WITH POD AS (
                    select DISTINCT pod.id, p.id as product_id, pod.quantity, p.unit_id, pu.name as unit_name, p.min_inventory, p.max_inventory,
                    p.code, p.name, pod.prime_cost, pod.inventory, pod.discount_type, pod.discount_value,
                    IF(pod.discount_type = 0, 'Không có', IF(pod.discount_type = 1, '%', 'Tiền mặt')) as discount_type_name,
                    pod.price * pod.quantity as totalPrice,
                    pod.discount_value * pod.quantity * pod.price / 100 as totalDiscount,
                    pod.price * pod.quantity - pod.discount_value * pod.quantity * pod.price / 100 as totalPriceAfterDiscount
                    from purchase_order_detail pod
                    left join product p on p.id = pod.product_id
                    left join purchase_order po on po.id = pod.order_id
                    left join product_unit pu on pu.id = p.unit_id
                    where po.id = ${id}
                )
                SELECT JSON_OBJECT(
                    'id', po.id,
                    'code', po.code,
                    'supplier_id', po.supplier_id,
                    'branch_id', po.branch_id,
                    'status', po.status,
                    'status_payment', psph.status,
                    'note', po.note,
                    "ship_method", po.ship_method,
                    "created_id", po.created_id,
                    'delivery_date', po.delivery_date,
                    'created_at', po.created_at,
                    'updated_at', po.updated_at,
                    'seller_id', po.seller_id,
                    'supplier_name', sp.name,
                    'branch_name', b.name,
                    'totalDiscount', COALESCE((select sum(pod.discount_value * pod.quantity * pod.price / 100) from purchase_order_detail pod left join purchase_order po1 on po1.id = pod.order_id where po1.id = po.id ), 0),
                    'totalPrice', COALESCE((select sum(pod.price * pod.quantity) from purchase_order_detail pod left join purchase_order po1 on po1.id = pod.order_id where po1.id = po.id ), 0),
                    'totalPriceAfterDiscount', COALESCE((select sum(pod.price * pod.quantity - pod.discount_value * pod.quantity * pod.price / 100) from purchase_order_detail pod left join purchase_order po1 on po1.id = pod.order_id where po1.id = po.id ), 0),
                    'total_amount_paid', COALESCE(psph.amount_paid, 0),
                    'debt', COALESCE((select sum(pod.price * pod.quantity - pod.discount_value * pod.quantity * pod.price / 100) from purchase_order_detail pod left join purchase_order po1 on po1.id = pod.order_id where po1.id = po.id ), 0) - COALESCE(psph.amount_paid, 0),
                    'employee_name', u.name,
                    'status_name', IF(po.status = 'cho_duyet', 'Tạo mới', IF(posh.status = 'nhap_hang', 'Nhập hàng', 'Hoàn thành')),
                    'order_detail', JSON_ARRAYAGG(
                        DISTINCT
                        JSON_OBJECT(
                            'id', POD.id,
                            'order_id', po.id,
                            'product_id', POD.product_id,
                            'quantity', POD.quantity,
                            'price', POD.prime_cost,
                            'inventory', POD.inventory,
                            'unit_id', POD.unit_id,
                            'unit_name', POD.unit_name,
                            'code', POD.code, 
                            'name', POD.name,
                            'discount_type_name', POD.discount_type_name,
                            'totalPrice', POD.totalPrice,
                            'totalDiscount', POD.totalDiscount,
                            'totalPriceAfterDiscount', POD.totalPriceAfterDiscount,
                            'min_inventory', POD.min_inventory,
                            'max_inventory', POD.max_inventory,
                            'discount_type', POD.discount_type,
                            'discount_value', POD.discount_value
                        )
                    ),
                    'order_status_history', JSON_ARRAYAGG(
                        DISTINCT
                        JSON_OBJECT(
                            'id', posh.id,
                            'order_id', posh.order_id,
                            'user_id', u.id,
                            'status', posh.status,
                            'created_at', posh.created_at,
                            'seller_id', posh.seller_id,
                            'branch_id', posh.branch_id,
                            'status_name', IF(posh.status = 'cho_duyet', 'Tạo mới', IF(posh.status = 'khoi_tao_san_pham', 'Khởi tạo sản phẩm', IF(posh.status = 'nhap_hang', 'Nhập hàng', 'Hoàn thành') ))
                        ) ORDER BY posh.created_at ASC
                    ),
                    'order_status_payment_history', JSON_ARRAYAGG(
                        DISTINCT
                        JSON_OBJECT(
                            'id', psph.id,
                            'order_id', psph.order_id,
                            'user_id', u.id,
                            'status', psph.status,
                            'created_at', psph.created_at,
                            'updated_at', psph.updated_at,
                            'seller_id', psph.seller_id,
                            'payment_method', psph.payment_method,
                            'payment_date', psph.payment_date,
                            'amount_paid', psph.amount_paid
                        ) ORDER BY psph.updated_at ASC
                    )
                ) AS result
                FROM purchase_order_detail pod
                left join POD on POD.id = pod.id
                left join purchase_order po on po.id = pod.order_id
                left join branch b on b.id = po.branch_id
                left join supplier sp on sp.id = po.supplier_id 
                left join users u on u.id = po.created_id
                left join purchase_status_payment_history psph on psph.order_id = po.id
                left join purchase_order_status_history posh on posh.order_id = po.id
                where po.id = ${id}
                group by po.id
        `
        const result = await database.executeQuery(query) as RowDataPacket
        if (result.length == 0) {
            return new HttpException(404, errorMessages.NOT_FOUND, 'id')
        }
        return {
            data: JSON.parse(result[0].result)
        }
    }

    public updateListStatus = async (listId: number[], status: string, model: CreateDto, from_branch?: number, reason?: string) => {
        //console.log("updateListStatus")
        console.log(listId, status, model)

        const listResponse = []
        let listCheck: any[] = []
        for (let i = 0; i < listId.length; i++) {
            const findById = await this.findById(listId[i]);
            console.log(findById)
            if (findById instanceof Error) {
                listCheck.push(listId[i])
            }
            if (status == StatusOrder.APPROVE) {
                if ((findById as any).data.order_status_history[0].status != StatusOrder.NEW && (findById as any).data.order_status_history[0].status != StatusOrder.NOT_CONFIRM) {
                    listCheck.push(listId[i])
                }
            }
            if (status == StatusOrder.CANCEL) {
                if ((findById as any).data.order_status_history[0].status != StatusOrder.NEW && (findById as any).data.order_status_history[0].status != StatusOrder.NOT_CONFIRM) {
                    listCheck.push(listId[i])
                }
            }
            if (status == StatusOrder.NOT_APPROVE) {
                if ((findById as any).data.order_status_history[0].status != StatusOrder.NEW && (findById as any).data.order_status_history[0].status != StatusOrder.NOT_CONFIRM) {
                    listCheck.push(listId[i])
                }
            }
            if (status == StatusOrder.CONFIRM) {
                if ((findById as any).data.order_status_history[0].status != StatusOrder.APPROVE) {
                    listCheck.push(listId[i])
                }
            }
            if (status == StatusOrder.NOT_CONFIRM) {
                if ((findById as any).data.order_status_history[0].status != StatusOrder.APPROVE) {
                    listCheck.push(listId[i])
                }
            }
            if (status == StatusOrder.IMPORT) {
                if ((findById as any).data.order_status_history[0].status == StatusOrder.COMPLETED || (findById as any).data.order_status_history[0].status == StatusOrder.CANCEL) {
                    listCheck.push(listId[i])
                }
                if (status == StatusOrder.COMPLETED) {
                    const checkDebt = (findById as RowDataPacket).data.debt;
                    if ((findById as any).data.order_status_history[0].status == StatusOrder.CANCEL || checkDebt > 0 || (findById as any).data.order_status_history[0].status == StatusOrder.NEW) {
                        listCheck.push(listId[i])
                    }
                }
                if (status == StatusOrder.CANCEL) {
                    if ((findById as any).data.order_status_history[0].status == StatusOrder.COMPLETED) {
                        listCheck.push(listId[i])
                    }
                }
            }

            if (listCheck.length > 0) {
                return new HttpException(400, errorMessages.PURCHASE_LIST_STATUS_UPDATE_INVALID, 'listId');
            }
            for (let i = 0; i < listId.length; i++) {
                const checkList = await checkExist(this.tableName, 'id', listId[i].toString());
                const purchase_order_detail = await this.orderDetailService.findAllOrderDetailByOrderId(listId[i]) as any
                console.log(purchase_order_detail)
                if (purchase_order_detail instanceof Error) {
                    return new HttpException(400, "Không tìm thấy danh sách sản phẩm", 'order_detail')
                }
                if (checkList == false) {
                } else {

                    const branch_id = await database.executeQuery(`select branch_id from purchase_order where id = ${listId[i]}`) as RowDataPacket
                
                    if (status == StatusOrder.APPROVE && checkList[0].type == 'import-warehouse-transfer') {
                        if (from_branch === undefined) {
                            return new HttpException(400, 'Chi nhánh xuất không được để trống', 'from_branch')
                        }
                        if (from_branch === branch_id[0].branch_id) {
                            return new HttpException(400, 'Chi nhánh xuất không được trùng với chi nhánh nhận')
                        }
                        const updatePurchaseOrder = await database.executeQuery(`update purchase_order set from_branch_id = ${from_branch} where id = ${listId[i]}`) as RowDataPacket
                        if (updatePurchaseOrder instanceof Error) {
                            return new HttpException(400, 'Cập nhật chi nhánh xuất không thành công', 'from_branch')
                        }
                    }
                    if (status == StatusOrder.CONFIRM && checkList[0].type == 'import-warehouse-transfer') {
                        const orderDetail = (findById as any).data.order_detail
                        let detail: any[] = []
                        for (let i = 0; i < orderDetail.length; i++) {
                            if (orderDetail[i].warehouse_quantity < orderDetail[i].quantity) {
                                return new HttpException(400, 'Số lượng sản phẩm trong kho không đủ')
                            }
                            detail.push({
                                product_id: orderDetail[i].product_id,
                                qty: orderDetail[i].quantity
                            })
                        }
                        const deliveryNoteModal: DeliveryNoteDto = {
                            created_id: model.created_id,        
                            delivery_note_detail: detail,
                            seller_id: checkList[0].seller_id,
                            branch_id: checkList[0].from_branch_id,
                            status: 'da_xuat_kho',
                            to_branch: checkList[0].branch_id,
                            type: 'xuat_kho_chuyen',
                            order_id: listId[i]
                        }
                        await this.deliveryNoteService.create(deliveryNoteModal)
                    }
                    if (status == StatusOrder.IMPORT && checkList[0].type == 'import-warehouse-transfer') {
                        const order_status_payment_history: any[] = [
                            {
                                payment_method: 'tien_mat',
                                amount_paid: 0
                            }
                        ]
                        for (let i = 0; i < order_status_payment_history.length; i++) {
                            order_status_payment_history[i].seller_id = model.seller_id;
                            let statusPaymentModel: PurchaseOrderStatusPaymentModel = {
                                user_id: model.created_id,
                                order_id: listId[i],
                                amount_paid: 0,
                                seller_id: model.seller_id,
                                created_at: new Date(),
                                payment_method: order_status_payment_history[i].payment_method,
                                payment_date: order_status_payment_history[i].payment_date,
                                status: order_status_payment_history[i].status
                            }
                            await this.purchaseOrderStatusPaymentService.create(statusPaymentModel);
                        }  
                    }
                      
                    const listModelStatus = []
                    listModelStatus.push({
                        order_id: listId[i],
                        status: status,
                        user_id: model.created_id,
                        seller_id: model.seller_id,
                        branch_id: branch_id[0].branch_id,
                        reason: reason
                    })
                    if (checkList[0].status == StatusOrder.NEW && checkList[0].type == 'import-warehouse-buy' && status == StatusOrder.APPROVE) {
                        listModelStatus.push({
                            order_id: listId[i],
                            status: StatusOrder.CONFIRM,
                            user_id: model.created_id,
                            seller_id: model.seller_id,
                            branch_id: branch_id[0].branch_id,
                            reason: reason
                        })
                    }
                    if (status == StatusOrder.IMPORT && checkList[0].type == 'import-warehouse-transfer') {
                        listModelStatus.push({
                            order_id: listId[i],
                            status: StatusOrder.COMPLETED,
                            user_id: model.created_id,
                            seller_id: model.seller_id,
                            branch_id: branch_id[0].branch_id,
                            reason: reason
                        })
                        const id = await database.executeQuery(`select id from delivery_note where order_id = ${listId[i]} and type = 'xuat_kho_chuyen'`) as RowDataPacket
                        if (id.length > 0) {
                            await this.deliveryNoteService.updateListStatus([id[0].id], StatusDeliveryOrder.COMPLETED, model.created_id!, model.seller_id!)
                        }
                    }
                    const modelUpdate: CreateDto = {
                        id: listId[i],
                        order_status_history: listModelStatus
                    }
                    const resultUpdateImport = await this.updateOrder(listId[i], modelUpdate)
                    if (resultUpdateImport instanceof Error) {
                        return new HttpException(400, errorMessages.UPDATE_STATUS_FAILED, 'status');
                    }
                    if ((resultUpdateImport as RowDataPacket).data != undefined) {
                        listResponse.push((resultUpdateImport as RowDataPacket).data)
                    }
                }
            }
        }
    }
    public updateStatusPayment = async (id: number, model: CreateDto) => {
        console.log('updateStatusPayment', model)
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(400, errorMessages.NOT_FOUND, 'id');
        const getOrder = await this.findById(id);
        const debt = (getOrder as any).data.debt;
        const currentStatus = (getOrder as any).data.status;
        let modelPayment: PurchaseOrderStatusPaymentModel = {
            order_id: id,
            status: StatusPaymentDetail.STATUS_PAID,
            seller_id: model.seller_id,
            user_id: model.created_id,
            amount_paid: model.price || debt,
            payment_method: model.payment_method,
            payment_date: model.payment_date || new Date()
        }
        const modelUpdate: CreateDto = {
            id: id,
        }
        console.log('modelPayment', modelPayment)
        modelUpdate.order_status_payment_history = [modelPayment]

        const resultUpdatePayment = await this.updatePaymentInfo(id, modelUpdate)
        if (resultUpdatePayment instanceof Error) {
            return new HttpException(400, resultUpdatePayment.message, resultUpdatePayment.field);
        }
        if ((model.price && model.price === debt && currentStatus == StatusOrder.IMPORT) || (!model.price && currentStatus == StatusOrder.IMPORT)) {
            const modelStatusCompleted: OrderStatus = {
                order_id: id,
                status: StatusOrder.COMPLETED,
                seller_id: model.seller_id,
                user_id: model.created_id,
                created_at: new Date(),
                branch_id: check[0].branch_id
            }
            const resultStatusCompleted = await this.orderStatusService.create(modelStatusCompleted)
            if (resultStatusCompleted instanceof Error) { }
            else {
                let query = `update ${this.tableName} set status = ? where id = ?`
                const values = []
                values.push(StatusOrder.COMPLETED)
                values.push(id)
                const resultStatus = await database.executeQuery(query, values);
            }
        }
        return {
            data: (resultUpdatePayment as RowDataPacket).data
        }
    }
    public updatePaymentInfo = async (id: number, model: CreateDto) => {
        if (model.order_status_payment_history != undefined) {

            const getOrder = await this.findById(id);
            if (getOrder instanceof Error) {
            }
            const total_amount_paid = (getOrder as any).data.total_amount_paid;
            let total_amount_paid_model = model.order_status_payment_history.reduce((total: number, item: any) => total + item.amount_paid, 0);
            console.log('total_amount_paid_model', total_amount_paid_model, total_amount_paid)
            total_amount_paid_model += total_amount_paid;
            if (total_amount_paid_model < 0 || total_amount_paid_model > (getOrder as any).data.totalPriceAfterDiscount) {
                return new HttpException(400, errorMessages.PURCHASE_MONEY_INVALID, 'amount_paid');
            }

            if (model.order_status_payment_history.length > 0) {
                for (let i = 0; i < model.order_status_payment_history.length; i++) {
                    let modelPayment: PurchaseOrderStatusPaymentModel = {
                        order_id: id,
                        status: model.order_status_payment_history[i].status || StatusPaymentDetail.STATUS_PAID,
                        seller_id: model.order_status_payment_history[i].seller_id,
                        user_id: model.order_status_payment_history[i].user_id,
                        amount_paid: model.order_status_payment_history[i].amount_paid,
                        payment_method: model.order_status_payment_history[i].payment_method,
                        payment_date: model.order_status_payment_history[i].payment_date || new Date()
                    }
                    const result = await this.purchaseOrderStatusPaymentService.create(modelPayment)
                    if (result instanceof Error) {
                        return new HttpException(400, errorMessages.CREATE_FAILED, 'order_status_payment_history');
                    }
                }
            }
        }
        return {
            data: {
                id: id,
                ...model,
            }
        }
    }

    public paymentAndPurchase = async (id: number, model: CreateDto) => {
        const branch = await database.executeQuery(`SELECT branch_id from ${this.tableName} where id = ?`, [id]) as RowDataPacket
        if (branch.length < 1) {
            return new HttpException(404, errorMessages.NOT_FOUND)
        }
        try {
            await this.updateStatusPayment(id, model)
            await this.updateListStatus([id], StatusOrder.IMPORT, model)

        } catch (error) {
            return new HttpException(404, errorMessages.UPDATE_FAILED)
        }

    }
    public paymentAndPurchaseList = async (ids: number[], model: CreateDto) => {
        let validPurchaseIds: number[] = ids
        let validPaymentIds: number[] = ids
        const notValidPurchaseIds = await database.executeQuery(`
            select posh.order_id from purchase_order_status_history posh 
            where  posh.order_id in (?) and posh.status = 'hoan_thanh'
        `, ids) as RowDataPacket

        const notValidPaymentIds = await database.executeQuery(`
            select psph.order_id from purchase_status_payment_history psph 
            where  psph.order_id in (?) and psph.status = 'da_thanh_toan'
        `, ids) as RowDataPacket
        if (notValidPurchaseIds.length > 0) {
            validPurchaseIds = ids.filter((item: any) => !notValidPurchaseIds.map((i: any) => i.order_id).includes(item))
        }
        if (notValidPaymentIds.length > 0) {
            validPaymentIds = ids.filter((item: any) => !notValidPaymentIds.map((i: any) => i.order_id).includes(item))
        }
        //console.log(notValidPurchaseIds, notValidPurchaseIds, ids)
        for (const id of validPaymentIds) {
            const branch = await database.executeQuery(`SELECT branch_id from ${this.tableName} where id = ?`, [id]) as RowDataPacket
            if (branch.length < 1) {
                return new HttpException(404, errorMessages.NOT_FOUND)
            }
            try {
                await this.updateStatusPayment(id, model)

            } catch (error) {
                return new HttpException(404, errorMessages.UPDATE_FAILED)
            }
        }
        await this.updateListStatus(validPurchaseIds, StatusOrder.IMPORT, model, model.created_id)

    }
}
export default PurchaseOrderService;


