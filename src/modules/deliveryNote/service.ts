import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar } from "@core/utils/gennerate.code";
import DeliveryNoteDetailService from "@modules/deliveryNoteDetail/service";
import { ISearch } from "./interface";
import { Time } from "@core/utils/time";
import WarehouseService from "@modules/warehouse/service";
import { CreateDto as WarehouseDto } from '@modules/warehouse/dtos/create.dto'
import OrderDetailService from "@modules/orderDetail/service";
import axios from "axios";
import BranchService from "@modules/branch/service";
import { findProductById, updateStatusOrder, updateStatusOrderDelivery } from "./ultils";
// import ProductService from "@modules/product/product.service";
class DeliveryNoteService {

    private tableName = 'delivery_note';
    private deliveryNoteDetailService = new DeliveryNoteDetailService();
    private warehouseService = new WarehouseService()
    private orderDetailService = new OrderDetailService()
    private branchService = new BranchService()
    // private productService = new ProductService()
    public create = async (model: CreateDto) => {
        console.log(model)
        let code = model.code
        if (code && code.length > 0) {
            if (await checkExist(this.tableName, 'code', code))
                return new HttpException(400, errorMessages.EXISTED, 'code');
        } else {
            code = await generateCodePrefixChar(this.tableName, 'XK', 8)
        }
        const created_at = new Date()
        const updated_at = new Date()
        const export_at = (model.status === "da_xuat_kho" || model.status === "hoan_thanh") ? new Date() : null
        const query = `insert into ${this.tableName} (code, created_id, seller_id, created_at, export_at, updated_at, from_branch, to_branch, status, description, type, order_id, delivery_type) 
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        const result = await database.executeQuery(query, [code, model.created_id, model.seller_id, created_at, export_at, updated_at, model.branch_id, model.to_branch || null, model.status || "cho_xuat", model.description || null, model.type || "xuat_kho_ban_le", model.order_id || null, model.delivery_type || null]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED)

        if (model.status === "da_xuat_kho" || model.status === "hoan_thanh") {
            const order = await checkExist('order_delivery_method', 'order_id', model.order_id!.toString())
            if (order != false && order[0].method != 'shop') {
                // tao don van chuyen
                console.log(order[0])
                const method = order[0].method == 'shipper' ? 'shipper' : 'viettelpost'
                const order_detail = await this.findByIdExpandCombo(order[0].order_id) as any
                const response = await axios.post(`${process.env.DELIVERY_URL!}/ship_services/create-ordership/${method}`, { order: order_detail.data })
                console.log(response)
            }
        }        
        // create delivery note detail
        let deliveryNoteDetail = model.delivery_note_detail;
        if (deliveryNoteDetail && deliveryNoteDetail.length > 0) {
            for (let i = 0; i < deliveryNoteDetail.length; i++) {
                const detail = deliveryNoteDetail[i];
                const check = await checkExist('product', 'id', detail.product_id!.toString());
                if (check == false) return new HttpException(404, errorMessages.NOT_FOUND, 'product_id');
                if (check[0].type == 'combo') {
                    await this.deliveryNoteDetailService.create({
                        delivery_note_id: (result as RowDataPacket).insertId,
                        product_id: detail.product_id,
                        qty: detail.qty,
                        seller_id: model.seller_id,
                        created_id: model.created_id,
                        branch_id: model.branch_id,
                        in_combo: 0
                    })
                }
                else if (detail.combo_id != undefined) {
                    await this.deliveryNoteDetailService.create({
                        delivery_note_id: (result as RowDataPacket).insertId,
                        product_id: detail.product_id,
                        qty: detail.qty,
                        seller_id: model.seller_id,
                        created_id: model.created_id,
                        branch_id: model.branch_id,
                        in_combo: detail.combo_id
                    })

                    // remove from warehouse 
                    if (model.status && model.status === 'hoan_thanh') {
                        await this.warehouseService.exportWarehouse(detail.product_id!.toString(), model.seller_id!.toString(), detail.qty!, model.branch_id)
                    }
                }
                else {
                    await this.deliveryNoteDetailService.create({
                        delivery_note_id: (result as RowDataPacket).insertId,
                        product_id: detail.product_id,
                        qty: detail.qty,
                        seller_id: model.seller_id,
                        created_id: model.created_id,
                        branch_id: model.branch_id,
                        in_combo: 0
                    })

                    // remove from warehouse 
                    if (model.status && model.status === 'hoan_thanh') {
                        await this.warehouseService.exportWarehouse(detail.product_id!.toString(), model.seller_id!.toString(), detail.qty!, model.branch_id)
                    }
                }
            }
        }


        return {
            data: {
                code: code,
                id: (result as any).insertId,
                ...model,
            }
        }
    }
    // public update = async (model: CreateDto, id: number) => {
    //     if (!await checkExist(this.tableName, 'id', id.toString()))
    //         return new HttpException(404, errorMessages.NOT_EXISTED, 'id');
    //     // if(model.code != undefined){
    //     //     if (await checkExist(this.tableName, 'code', model.code, id.toString()))
    //     //         return new HttpException(400, errorMessages.EXISTED, 'code');
    //     // }
    //     const updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    //     let query = `update ${this.tableName} set `;
    //     let params = [];
    //     // if (model.code != undefined) {
    //     //     query += `code = ?, `;
    //     //     params.push(model.code);
    //     // }
    //     if (model.created_id != undefined) {
    //         query += `created_id = ?, `;
    //         params.push(model.created_id);
    //     }
    //     query += `updated_at = ? where id = ?`;
    //     params.push(updated_at);
    //     params.push(id);
    //     const result = await database.executeQuery(query, params);
    //     if ((result as any).affectedRows === 0)
    //         return new HttpException(400, errorMessages.UPDATE_FAILED);
    //     return {
    //         data: {
    //             id: id,
    //             ...model,
    //             updated_at: updated_at
    //         }
    //     }
    // }

    public delete = async (id: number) => {
        if (!await checkExist(this.tableName, 'id', id.toString()))
            return new HttpException(404, errorMessages.NOT_EXISTED, 'id');
        const result = await database.executeQuery(`delete from ${this.tableName} where id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        const child = await database.executeQuery(`select id from delivery_note_detail where delivery_note_id = ?`, [id]) as RowDataPacket
        if (child.length > 0) {
            await this.deliveryNoteDetailService.deleteRows(child.map((i: any) => i.id))
        }
        return {
            data: {
                message: errorMessages.DELETE_SUCCESS,
                id: id
            }
        }
    }
    public findById = async (id: number) => {
        const query = `
            select dn.id, dn.code, dn.created_at, dn.export_at as exported_at, u.name as created_name, b.id as branch_id, u.id as user_id, b.name as branch_name,
            CASE 
                WHEN dn.status = "cho_xuat" THEN "Chờ xuất kho"
                WHEN dn.status = "da_xuat_kho" THEN "Đã đóng gói"
                WHEN dn.status = "hoan_thanh" THEN "Đã xuất kho"
                WHEN dn.status = "da_huy" THEN "Đã hủy"
                ELSE NULL 
            END as status,
            CASE 
                WHEN dn.order_id IS NOT NULL THEN o.code
                ELSE NULL 
            END as order_code,
            dn.status as status_key,
            dn.description,
            dn.type,
            CASE 
                WHEN dn.type = "xuat_kho_ban_le" THEN "Xuất kho bán lẻ"
                WHEN dn.type = "xuat_kho_trong_ky" THEN "Xuất kho trong kỳ"
                WHEN dn.type = "xuat_kho_chuyen" THEN "Xuất kho chuyển"
            END as type_name,
            dn.delivery_type
            from ${this.tableName} dn
            left join users u on u.id = dn.created_id
            left join branch b on b.id = dn.from_branch
            left join orders o on o.id = dn.order_id
            where dn.id = ?
        `
        const result = await database.executeQuery(query, [id]) as RowDataPacket[]
        if (result.length < 1)
            return new HttpException(404, errorMessages.NOT_EXISTED, 'id');
        const detail = await this.deliveryNoteDetailService.findAllByDeliveryNoteId(id);
        console.log(detail);
        (result as RowDataPacket[])[0].delivery_note_detail = (detail as RowDataPacket).data;
        for (const item of result[0].delivery_note_detail) {
            if (item.product_type == 'combo') {
                item.combo_details = await database.executeQuery(`
                    select 
                        p.id,
                        p.code,
                        dnd.product_id,
                        dnd.qty as quantity,
                        p.name as name,
                        IFNULL((select CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', COALESCE((select code from product where id = (select parent_id from product where id = dnd.product_id)), (select code from product where id = dnd.product_id)), '/', pi.image) from product_image pi where product_id = dnd.product_id limit 1), null) as image
                    from delivery_note_detail dnd
                    left join product p on p.id = dnd.product_id
                    left join product_image pi on pi.product_id = p.id
                    where dnd.delivery_note_id = ? and dnd.in_combo = ?
                `, [item.delivery_note_id, item.product_id]) as RowDataPacket
            }
        }
        return {
            data: (result as any)[0]
        }
    }
    public searchs = async (key: string, name: string, publish: boolean, page: number, limit: number, fromDate: string, toDate: string, branch_id: number, seller_id: number, status: string, user_id: number) => {
        if (fromDate != undefined && toDate != undefined) {
            fromDate = Time.addTimeIfMissing(fromDate, '00:00:00');
            toDate = Time.addTimeIfMissing(toDate, '23:59:59');
        }
        const params = []
        if (fromDate) {
            params.push(fromDate)
        }
        if (toDate) {
            params.push(toDate)
        }
        const user_branch_ids = await database.executeQuery(`select branch_id from employee_branch  where user_id = ?`, [user_id]) as RowDataPacket
        let query = `
            select dn.id, dn.code, dn.created_at, dn.export_at, u.name as created_name, b.id as branch_id, u.id as user_id, b.name as branch_name,
            CASE 
                WHEN dn.status = "cho_xuat" THEN "Chờ xuất kho"
                WHEN dn.status = "da_xuat_kho" THEN "Đã đóng gói"
                WHEN dn.status = "da_huy" THEN "Đã hủy"
                WHEN dn.status = "hoan_thanh" THEN "Đã xuất kho"
                ELSE NULL 
            END as status,
            dn.status as status_key,
            CASE 
                WHEN dn.type = "xuat_kho_ban_le" THEN "Xuất kho bán lẻ"
                WHEN dn.type = "xuat_kho_trong_ky" THEN "Xuất kho trong kỳ"
                WHEN dn.type = "xuat_kho_chuyen" THEN "Xuất kho chuyển"
            END as type_name
            from ${this.tableName} dn
            left join users u on u.id = dn.created_id
            left join branch b on b.id = dn.from_branch
            where 1=1 and dn.seller_id = ${seller_id}
            ${fromDate ? 'and dn.created_at >= ?' : ''} ${toDate ? 'and dn.created_at <= ?' : ''}
        `
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} dn WHERE 1=1 and dn.seller_id = ${seller_id} ${fromDate ? ' and dn.created_at >= ?' : ''} ${toDate ? ' and dn.created_at <= ?' : ''}`;
        if (key && key.length != 0) {
            query += ` and dn.code like '%${key}%'`
            countQuery += ` and dn.code like '%${key}%'`
        }
        if (branch_id !== undefined) {
            query += ` and dn.from_branch = ${branch_id}`
            countQuery += ` and dn.from_branch = ${branch_id}`
        }
        if (user_branch_ids.length > 0 && branch_id == undefined) {
            const branch_ids = user_branch_ids.map((i: any) => i.branch_id)
            if (branch_ids.length > 0 && !branch_ids.includes(0)) {
                query += ` and dn.from_branch in (${branch_ids})`
                countQuery += ` and dn.from_branch in (${branch_ids})`
            }
        }
        if (status !== undefined) {
            query += ` and dn.status = ${status}`
            countQuery += ` and dn.status = ${status}`
        }
        if (page && page < 1 || page && limit < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        query += ` order by dn.id desc`
        if (page && limit)
            query = query + ` LIMIT ` + limit + ` OFFSET ` + (page - 1) * limit;
        console.log(query)
        let pagination: IPagiantion = {
            page: page,
            limit: limit,
            totalPage: 0
        }
        console.log(query, params)
        const count = await database.executeQuery(countQuery, params);
        const totalPages = Math.ceil((count as RowDataPacket[])[0].total / limit);
        if (Array.isArray(count) && count.length > 0)
            pagination.totalPage = totalPages
        const result = await database.executeQuery(query, params);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result,
            pagination: pagination
        }
    }

    public findByIdExpandCombo = async (id: number) => {
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
                wd.name as ward_name,
                (select name from shipers where id = odm.shipper_id limit 1) as shipper_name,
                (select id from shipers where id = odm.shipper_id limit 1) as shipper_id,
                (select ship_fee from shipers where id = odm.shipper_id limit 1) as ship_fee,
                (select ship_fee_payer from shipers where id = odm.shipper_id limit 1) as ship_fee_payer
            FROM orders o 
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

        order.order_detail = [] //(orderDetail as any).data;
        order.branch = (branch as any).data;

        for (const element of (orderDetail as any).data) {
            const product = await findProductById(element.product_id);
            if (product instanceof Error) return;

            const productData = product.data;
            element.code = productData.code;
            element.name = productData.name;
            element.weight = productData.weight_id == 1 ? productData.weight : productData.weight * 1000;

            if (productData.images?.length) {
                element.image_thumbnail = productData.images[0].image_thumbnail;
            }
            order.order_detail.push(element)
        }

        // Get creator info
        if (order.created_id) {
            const creator = await checkExist('users', 'id', order.created_id.toString());
            if (creator?.[0]) {
                order.created_name = `${creator[0].name} ${creator[0].phone}`;
                order.employee_name = creator[0].name;
            }
        }

        return { data: order };
    }


    public updateListStatus = async (data: number[], status: string, created_id: number, seller_id: number, is_delivery?: boolean) => {
        console.log(status, data, created_id, seller_id)
        try {
            console.log(is_delivery)
            let result = null;
            const update_at = new Date()
            const params = []
            let query = `update ${this.tableName} set status = ?, updated_at = ? `
            params.push(status)
            params.push(update_at)
            if (status === 'da_xuat_kho') {
                query += ` , export_at = ?`
                params.push(update_at)
            }
            query += ` where id in (${data}) and status != 'da_huy'`
            result = await database.executeQuery(query, params) as RowDataPacket;
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }

            if (status === 'da_xuat_kho') {
                for (const element of data) {
                    const exist = await checkExist(this.tableName, 'id', element.toString())
                    if (exist === false) {
                        return new HttpException(404, errorMessages.NOT_EXISTED, 'id')
                    }
                }
            }
            if (status === 'hoan_thanh') {
                for (const element of data) {
                    const exist = await checkExist(this.tableName, 'id', element.toString())
                    if (exist === false) {
                        return new HttpException(404, errorMessages.NOT_EXISTED, 'id')
                    }

                    const detail = await this.deliveryNoteDetailService.findAllByDeliveryNoteId(element) as any
                    if (detail instanceof Error) {
                        return new HttpException(404, errorMessages.UPDATE_FAILED)
                    }
                    for (const data of detail.data) {
                        await this.warehouseService.exportWarehouse(data.product_id!.toString(), data.seller_id!.toString(), data.qty!, data.branch_id)
                    }
                    if (exist[0].type == "xuat_kho_ban_le") {  
                        const result = await updateStatusOrder(exist[0].order_id, 4, created_id, seller_id)
                        if (exist[0].delivery_type == 'xuat_kho_tu_giao') {
                            const result = await updateStatusOrderDelivery(exist[0].order_id, 'da_lay_hang')
                            console.log('result', result)
                        }

                    }
                }
            }
            if (status == 'da_huy') {
                for (const element of data) {
                    const exist = await checkExist(this.tableName, 'id', element.toString())
                    const result = await updateStatusOrder(exist[0].order_id, 6, created_id, seller_id)
                }
            }
            return {
                data: {
                    status: status,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public reportDeliveryNote = async () => {
        const result = await this.deliveryNoteDetailService.groupByProductId();

        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result
        }
    }
    public reportDeliveryNoteByCreatedAt = async (model: ISearch) => {
        // fromDate?: string, toDate?: string, date?: string
        if (model.fromDate && model.toDate && model.fromDate != undefined && model.toDate != undefined) {
            // model.fromDate = model.fromDate + ' 00:00:00';
            // model.toDate = model.toDate + ' 23:59:59';
            model.fromDate = model.fromDate;
            model.toDate = model.toDate;
        }
        if (model.date && model.date != undefined) {
            model.fromDate = model.date + ' 00:00:00';
            model.toDate = model.date + ' 23:59:59';
        }

        if (model.fromDate != undefined && model.toDate != undefined) {
            model.fromDate = Time.addTimeIfMissing(model.fromDate, '00:00:00');
            model.toDate = Time.addTimeIfMissing(model.toDate, '23:59:59');
        };
        const result = await this.deliveryNoteDetailService.groupByProductIdAndCreatedAt(model);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        if (result instanceof Error && result.field) {
            return new HttpException(400, result.message, result.field);
        }
        if (result instanceof Error)
            return new HttpException(400, result.message);
        return {
            data: (result as RowDataPacket).data,
            pagination: (result as RowDataPacket).pagination
        }
    }
    public reportListDelivery = async (model: ISearch) => {
        const result = await this.deliveryNoteDetailService.groupByProductAndFilter(model);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: (result as RowDataPacket).data,
            pagination: (result as RowDataPacket).pagination
        }
    }

    public update = async (id: number, model: CreateDto) => {
        console.log(model)
        if (model.code) {
            const codeExist = await database.executeQuery(`
                select id from ${this.tableName} where code = ?
            `, [model.code]) as RowDataPacket

            if (codeExist.length > 0 && codeExist[0].id != id) {
                return new HttpException(404, errorMessages.CODE_EXISTED)
            }
        }
        const check = await checkExist(this.tableName, 'id', id);
        if (check == false)
            return new HttpException(400, errorMessages.NOT_FOUND, 'id');
        if (check[0].status === 'da_xuat_kho') {
            return new HttpException(400, 'Đã xuất kho không thể cập nhật', 'status')
        }

        let errors = []
        if (model.delivery_note_detail != undefined) {
            for (const element of model.delivery_note_detail) {
                const query = `
                            SELECT
                                COALESCE(w.quantity, 0) - COALESCE((
                                    SELECT SUM(od.quantity) 
                                    FROM orders o 
                                    LEFT JOIN order_detail od ON o.id = od.order_id
                                    WHERE o.status <= 3 
                                    AND od.product_id = w.product_id 
                                    AND b.online_selling = 1
                                ), 0) - COALESCE((
                                    SELECT SUM(dnd.qty) 
                                    FROM delivery_note dn 
                                    LEFT JOIN delivery_note_detail dnd ON dn.id = dnd.delivery_note_id
                                    WHERE dn.status = "cho_xuat"
                                    AND dn.id != ${id}
                                    AND dnd.product_id = w.product_id 
                                    AND b.online_selling = 1
                                ), 0) AS available
                            FROM warehouse w
                            LEFT JOIN branch b ON w.branch_id = b.id
                            LEFT JOIN product p ON w.product_id = p.id
                            WHERE w.product_id = ${element.product_id}
                        `
                const available = await database.executeQuery(query) as RowDataPacket
                console.log(query, available, available[0].available < element.qty!)
                if (available[0].available < element.qty!) {
                    errors.push({
                        product_id: element.product_id,
                        error: `Số lượng sản phẩm trong kho không đủ - có thể mua: ${available[0].available}`
                    })
                }
            }
        }
        console.log(errors)
        if (errors.length > 0) {
            return {
                data: {
                    status: 400,
                    errors
                }
            }
        }

        if (model.delivery_note_detail != undefined && model.delivery_note_detail.length > 0) {
            const findAllDetail = await this.deliveryNoteDetailService.findAllByDeliveryNoteId(id)
            if (findAllDetail instanceof Error && model.delivery_note_detail.length > 0) {
                for (let i = 0; i < model.delivery_note_detail.length; i++) {
                    const dto = {
                        delivery_note_id: id,
                        product_id: model.delivery_note_detail[i].product_id,
                        qty: model.delivery_note_detail[i].qty,
                        created_id: model.created_id,
                        seller_id: model.seller_id,
                        branch_id: model.branch_id || check[0].from_branch,
                    }
                    console.log(dto)
                    const result = await this.deliveryNoteDetailService.create(dto)
                    if (result instanceof Error) {
                        return new HttpException(400, errorMessages.CREATE_FAILED, 'delivery_note_detail');
                    }
                }
            } else {
                for (let i = 0; i < (findAllDetail as any).data.length; i++) {
                    const result = await this.deliveryNoteDetailService.delete((findAllDetail as any).data[i].id)
                    if (result instanceof Error) {
                        return new HttpException(400, errorMessages.DELETE_FAILED, 'delivery_note_detail');
                    }
                }
                for (let i = 0; i < model.delivery_note_detail.length; i++) {
                    const dto = {
                        delivery_note_id: id,
                        product_id: model.delivery_note_detail[i].product_id,
                        qty: model.delivery_note_detail[i].qty,
                        created_id: model.created_id,
                        seller_id: model.seller_id,
                        branch_id: model.branch_id || check[0].from_branch,
                    }
                    console.log(dto)
                    const result = await this.deliveryNoteDetailService.create(dto)
                    if (result instanceof Error) {
                        return new HttpException(400, errorMessages.CREATE_FAILED, 'delivery_note_detail');
                    }
                }
            }
        }
        const updated_at = new Date()
        let query = `update ${this.tableName} set `;
        let params = [];
        if (model.code != undefined) {
            query += `code = ?, `;
            params.push(model.code);
        }
        if (model.created_id != undefined) {
            query += `created_id = ?, `;
            params.push(model.created_id);
        }
        if (model.description !== undefined) {
            query += `description = ?, `;
            params.push(model.description);
        }
        if (model.branch_id !== undefined) {
            query += `from_branch = ?, `;
            params.push(model.branch_id);
        }
        if (model.type !== undefined) {
            query += `type = ?, `;
            params.push(model.type);
        }
        query += `updated_at = ? where id = ?`;
        params.push(updated_at);
        params.push(id);
        const result = await database.executeQuery(query, params);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);

        return {
            data: {
                id: id,
                ...model,
                updated_at: updated_at
            }
        }
    }

    public updateDelivery = async (order_id: number, status: number, seller_id: number) => {
        console.log(order_id, status, seller_id)
        const query = `
            select id from ${this.tableName} where order_id = ? and type = "xuat_kho_ban_le" and seller_id = ?
        `   
        const result = await database.executeQuery(query, [order_id, seller_id]) as RowDataPacket

        if (result.length === 0) {
            return new HttpException(404, errorMessages.NOT_FOUND, 'id')
        }

        if (result.length > 0) {
            const id = result[0].id
            let status_order = ''
            console.log(status, id) 
            if (status == 105 || status == 200) {
                status_order = "hoan_thanh"
                const update = await this.updateListStatus([id], status_order, 0, 0, true)
                return update
            }
            if (status == 501) {
                console.log(status, id)
                const update = await updateStatusOrder(order_id, 5, 0, 0)
                console.log(update)
                return update
            }
            if (status == 107) {
                const update = await this.updateListStatus([id], 'da_huy', 0, 0, true)
                return update
            }
        }
        return new HttpException(404, errorMessages.NOT_FOUND, 'id')
    }

}

export default DeliveryNoteService;