import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import mysql from "mysql2/promise";
import Ilog from "@core/interfaces/log.interface";
import { CreateDto as WarehouseHistoryModel } from "@modules/warehouseHistory";
import WarehouseHistoryService from "@modules/warehouseHistory/service";
import { Time } from "@core/utils/time";

class WarehouseService {
    private tableName = 'warehouse';
    private moduleId = 26;
    private warehouseHistoryService = new WarehouseHistoryService()

    public create = async (model: CreateDto) => {
        const existQuery = `SELECT * FROM ${this.tableName} WHERE product_id = ? AND branch_id = ?`
        const exist = await database.executeQuery(existQuery, [model.product_id, model.branch_id || null]) as RowDataPacket
        if (exist.length === 0) {
            try {
                const created_at = new Date()
                const updated_at = new Date();
                const log: Ilog = {
                    action: errorMessages.CREATE,
                    user_id: model.created_id!,
                    module_id: this.moduleId,
                }
                // const defaultBranchQuery = `SELECT id from branch where seller_id = ? and is_default = 1`
                // const defaultBranch = await database.executeQuery(defaultBranchQuery, [model.seller_id]) as RowDataPacket
                const result = await database.executeQueryLog(
                    `INSERT INTO ${this.tableName} (product_id, supplier_id, branch_id, quantity, created_id, seller_id, created_at, updated_at) VALUES ( ?, ? , ? , ? , ? , ? , ? , ? )`,
                    [
                        model.product_id,
                        model.supplier_id,
                        model.branch_id || null,
                        model.quantity || 0,
                        model.created_id,
                        model.seller_id,
                        created_at,
                        updated_at,
                    ], {
                    action: errorMessages.CREATE,
                    user_id: model.created_id!,
                    module_id: this.moduleId,
                });
                if ((result as any).affectedRows === 0)
                    return new HttpException(400, errorMessages.CREATE_FAILED);
                const warehouse_history: WarehouseHistoryModel = {
                    product_id: model.product_id,
                    branch_id: model.branch_id,
                    quantity_after: 0,
                    created_id: model.created_id,
                    quantity_before: 0,
                    created_at: new Date(),
                    updated_at: new Date(),
                    quantity: model.quantity || 0,
                    seller_id: model.seller_id,
                    note: "nhập hàng"
                }

                await this.warehouseHistoryService.create(warehouse_history)
                let data = {
                    id: (result as any).insertId,
                    ...model,
                    created_at: created_at,
                    updated_at: updated_at
                }
                return {
                    data: data
                }
            } catch (error) {
                return new HttpException(400, errorMessages.CREATE_FAILED);
            }
        }
        else {
            const query = `UPDATE ${this.tableName} SET quantity = quantity + ? WHERE product_id = ? AND branch_id = ?`
            const result = await database.executeQuery(query, [model.quantity, model.product_id, model.branch_id]) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }
        }
    }
    public delete = async (id: number) => {
        const checkId = await checkExist(this.tableName, 'id', id.toString());
        if (checkId == false)
            return new HttpException(404, errorMessages.NOT_FOUND)
        const result = await database.executeQuery(`delete from ${this.tableName} where id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: id
        }
    }

    public deleteProductOfSeller = async (product_id: number, seller_id: number) => {
        const checkId = await database.executeQuery(`SELECT id from ${this.tableName} where product_id = ${product_id} and seller_id = ${seller_id}`) as RowDataPacket
        if (checkId.length < 1)
            return new HttpException(404, errorMessages.NOT_FOUND)
        const result = await database.executeQuery(`delete from ${this.tableName} where product_id = ${product_id} and seller_id = ${seller_id}`);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: checkId[0].id
        }
    }

    public updateProfile = async (model: CreateDto) => {
        const existQuery = `SELECT branch_id FROM ${this.tableName} WHERE product_id = ?`
        const exist = await database.executeQuery(existQuery, [model.product_id]) as RowDataPacket
        //console.log(exist, exist[0].branch_id !== null)
        const existList = exist.map((branch: any) => branch.branch_id)
        if (!existList.includes(null) && !existList.includes(model.branch_id)) {
            return this.create(model)
        }
        let result = null;
        // const checkId = await checkExist(this.tableName, 'id', id.toString());

        let historyQuery = `SELECT quantity FROM ${this.tableName} WHERE product_id = ?`
        if (!existList.includes(null)) {
            historyQuery += ` AND branch_id = ${model.branch_id}`;
        }
        const oldQuantity = await database.executeQuery(historyQuery, [model.product_id]) as RowDataPacket

        // const code = (checkId as any)[0].code;
        const updated_at = new Date()
        let query = `update ${this.tableName} set `;
        let values = [];
        if (model.product_id !== undefined) {
            query += `product_id = ?, `;
            values.push(model.product_id);
        }
        if (model.supplier_id !== undefined) {
            query += `supplier_id = ?, `;
            values.push(model.supplier_id);
        }
        if (model.branch_id !== undefined) {
            query += `branch_id = ?, `;
            values.push(model.branch_id);
        }
        if (model.quantity !== undefined) {
            query += `quantity = quantity + ?, `;
            values.push(model.quantity);
        }
        if (model.created_id !== undefined) {
            query += `created_id = ?, `;
            values.push(model.created_id);
        }
        if (model.seller_id !== undefined) {
            query += `seller_id = ?, `;
            values.push(model.seller_id);
        }
        query += `updated_at = ? WHERE product_id = ?`;
        values.push(updated_at);
        values.push(model.product_id);
        if (!existList.includes(null)) {
            query += ` AND branch_id = ?`;
            values.push(model.branch_id);
        }
        let log: Ilog = {
            action: errorMessages.UPDATE,
            user_id: model.created_id!,
            module_id: this.moduleId,
        }
        //console.log(query, values)
        try {
            result = await database.executeQueryLog(query, values, log);
            if ((result as mysql.ResultSetHeader).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            const warehouse_history: WarehouseHistoryModel = {
                product_id: model.product_id,
                branch_id: model.branch_id,
                quantity_after: oldQuantity[0].quantity + model.quantity,
                created_id: model.created_id,
                quantity_before: oldQuantity[0].quantity,
                created_at: new Date(),
                updated_at: new Date(),
                quantity: model.quantity,
                seller_id: model.seller_id,
                note: "nhập hàng"
            }

            await this.warehouseHistoryService.create(warehouse_history)
            // let data = {
            //     id: id,
            //     ...model,
            //     code: code,
            //     updated_at: updated_at
            // }
            // return {
            //     data: data
            // };
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        }
    }
    public async findById(id: number) {
        let query = `select *  from ${this.tableName} where id = ?`;
        const result = await database.executeQuery(query, [id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: {
                ...(result as any)[0],
            }
        }
    }
    public addCollate = async (query: string) => {
        return query.replace(/(s\.\w+)/g, (match) => `${match} COLLATE utf8mb4_general_ci`);
    }
    public searchs = async (key: string, supplier_id: number, branch: number, page: number, limit: number, seller_id: number, user_id: number) => {
        let branch_id: number[] = [];
        
        // Get branch IDs
        if (branch === undefined) {
            const user_branches = await database.executeQuery(`select branch_id from employee_branch where user_id = ?`, [user_id]) as RowDataPacket;
            const user_branch_ids = user_branches.map((branch: any) => branch.branch_id);
            if (user_branches.length > 0 && !user_branch_ids.includes(0)) {
                branch_id = user_branch_ids;
            }
        } else {
            branch_id = [branch];
        }

        // Build base query
        let query = `
            select w.id, w.created_at,
            IFNULL(CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/',IFNULL((select code from product where id = p.parent_id), p.code),'/thumbnail/',pi.image), NULL) as image,
            p.name as product_name, sum(w.quantity) as inventory, p.max_inventory, p.min_inventory,
            p.price, p.id as product_id, p.code as product_code, p.price_wholesale, p.price_import, w.branch_id, b.name as branch_name 
            from warehouse w 
            LEFT JOIN product p on p.id = w.product_id
            LEFT JOIN branch b on w.branch_id = b.id
            LEFT JOIN product_image pi ON pi.id = ( 
                SELECT MIN(id) 
                FROM product_image 
                WHERE product_image.product_id = w.product_id
            )
            where w.seller_id = ${seller_id}
        `;

        // Add filters
        if (key !== undefined) {
            query +=  (` AND CONCAT_WS('/', p.name, p.code) LIKE %${key}%`);
        }

        if (supplier_id !== undefined) {
            query +=  (`AND w.supplier_id = ${supplier_id}`);
        }

        if (branch_id.length > 0) {
            query +=  (` AND w.branch_id IN (${branch_id})`);
        }

        query += ` GROUP By w.product_id, w.seller_id ORDER BY w.id DESC`;

        // Validate pagination
        if (page && (page < 1 || limit < 1)) {
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        }

        console.log(query, seller_id)
        // Get total count
        const count = await database.executeQuery(query) as RowDataPacket;

        // Add pagination
        if (page && limit) {
            query += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
        }

        const pagination: IPagiantion = {
            page: page || 1,
            limit: limit || 10,
            totalPage: Math.ceil(count.length / limit) || 0
        };

        // Execute final query
        console.log(query)
        const result = await database.executeQuery(query) as RowDataPacket[];
        if (!result.length) {
            return new HttpException(404, errorMessages.NOT_FOUND);
        }

        // Get available quantities and format response
        const formattedResult = await Promise.all(result.map(async (item: any) => {
            
            const available = (await this.getAvailableQuantity(item.product_id, branch_id, seller_id)).data * 1;
            console.log(available)
            return {
                ...item,
                available,
                price: Number(item.price),
                price_wholesale: Number(item.price_wholesale), 
                price_import: Number(item.price_import)
            };
        }));

        return {
            data: formattedResult,
            pagination
        };
    }
    public updateStatus = async (id: number) => {
        try {
            let result = null;
            let status = 0
            const update_at = new Date()
            const getstatus = await database.executeQuery(`select status from ${this.tableName} where id = ?`, [id]);
            if ((getstatus as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND, 'id');
            if ((getstatus as RowDataPacket[])[0].status == 0) {
                status = 1
                result = await database.executeQuery(`update ${this.tableName} set status = ?, updated_at = ? where id = ?`, [status, update_at, id]);
            }
            if ((getstatus as RowDataPacket[])[0].status == 1) {
                result = await database.executeQuery(`update ${this.tableName} set status = ?, updated_at = ? where id = ?`, [status, update_at, id]);
            }
            return {
                data: {
                    id: id,
                    status: status,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }

    public statistics = async () => {
        let countQuery = `SELECT 
            COUNT(CASE WHEN status = 1 THEN 1 END) AS totalstatus,
            COUNT(CASE WHEN status = 0 THEN 1 END) AS totalUnstatus,
            COUNT(*) AS total
        FROM ${this.tableName};`;
        const result = await database.executeQuery(countQuery);
        return (result as RowDataPacket[])[0];
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
    public updateListStatus = async (data: number[], status: number) => {
        try {
            let result = null;
            const update_at = new Date()
            let query = `update ${this.tableName} set status = ?, updated_at = ? where id in (${data})`
            result = await database.executeQuery(query, [status, update_at]);
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

    public checkQuantity = async (quantity: number, product_id: string, branch_id: string) => {
        try {
            const getAvailabeQuery = `
                select 
                IFNULL((w.quantity - (
                    select sum(od.quantity) as sum from orders o 
                    LEFT JOIN order_detail od on o.id = od.order_id
                    WHERE (o.status <= 3 or o.status = 7) and od.product_id = w.product_id and od.seller_id = w.seller_id)
                ) , w.quantity) as available
                FROM warehouse w
                where w.product_id = ? and w.branch_id = ?
            `
            const available = await database.executeQuery(getAvailabeQuery, [product_id, branch_id]) as RowDataPacket
            if (available[0].available < quantity) {
                return new HttpException(400, "Số lượng sản phẩm trong kho không đủ")
            }
        } catch (error) {
            return new HttpException(400, "Kiểm tra thất bại")
        }
    }

    public exportWarehouse = async (product_id: string, seller_id: string, quantity: number, branch_id?: number) => {
       //console.log('aaa', product_id, seller_id, typeof quantity, branch_id)
        try {
            let query = `
                UPDATE warehouse SET quantity = quantity - ${quantity || 0} WHERE product_id = ${product_id} `
            if (branch_id) {
                query += ` AND branch_id = ${branch_id}`
            }
            else {
                query += ` AND branch_id = (
	                SELECT min(id) from branch where seller_id = ${seller_id}
                )`
            }
           //console.log(query)
            const result = await database.executeQuery(query) as RowDataPacket
           //console.log(result)
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }

    public getInventorySummary = async (search: string, branchId: number, seller_id: number, limit: number, page: number) => {
       //console.log('aa', search)
        try {
            const countQuery = `
                SELECT 
                    p.id as count
                FROM product p
                LEFT JOIN warehouse w ON w.product_id = p.id
                LEFT JOIN branch b ON b.id = w.branch_id
                LEFT JOIN product_unit pu ON pu.id = p.unit_id
                LEFT JOIN product parent ON parent.id = p.parent_id
                LEFT JOIN product child ON child.parent_id = p.id
                WHERE b.seller_id = ? and (? IS NULL OR b.id = ?) AND (p.parent_id != 0 OR child.id IS NULL)  AND (? IS NULL OR CONCAT_WS('/', p.name, parent.name, p.code) LIKE '${'%'+ search+ '%'}' )
                GROUP BY p.id, p.code, p.name, pu.name, w.quantity, p.price_import
            `
            const count = await database.executeQuery(countQuery, [seller_id, branchId || null, branchId || null, search || null]) as RowDataPacket
            const query = `
                WITH ProductData AS (
                    SELECT
                        p.parent_id,
                        parent.name as parent_name,
                        p.id AS product_id,
                        p.code,
                        p.name AS product_name,
                        pu.name AS unit_name,
                        b.name AS branch_name,
                        COALESCE((
                            select sum(dnd.qty) from delivery_note_detail dnd 
                            where dnd.product_id = p.id  and dnd.branch_id = b.id), 0) AS so_luong_xuat_kho,
                        COALESCE((
                            select sum(dnd.qty) from delivery_note_detail dnd 
                            where dnd.product_id = p.id  and dnd.branch_id = b.id), 0) * p.price AS gia_tri_xuat_kho,
                        COALESCE(SUM(DISTINCT CASE WHEN posh.status = 'khoi_tao_san_pham' THEN pod.quantity END), 0) AS so_luong_nhap_kho_dau_ky,
                        COALESCE(SUM(DISTINCT CASE WHEN posh.status = 'khoi_tao_san_pham' THEN pod.quantity * pod.price END), 0) AS gia_tri_nhap_kho_dau_ky,
                        COALESCE(SUM(DISTINCT CASE WHEN posh.status = 'nhap_hang' THEN pod.quantity END), 0) - 
                        COALESCE(SUM(DISTINCT CASE WHEN posh.status = 'khoi_tao_san_pham' THEN pod.quantity END), 0) AS so_luong_nhap_kho,
                        (COALESCE(SUM(DISTINCT CASE WHEN posh.status = 'nhap_hang' THEN pod.quantity END), 0) - 
                        COALESCE(SUM(DISTINCT CASE WHEN posh.status = 'khoi_tao_san_pham' THEN pod.quantity END), 0)) * pod.price AS gia_tri_nhap_kho,
                        COALESCE(w.quantity, 0) AS so_luong_cuoi_ky,
                        COALESCE(w.quantity * p.price, 0) AS gia_tri_cuoi_ky
                    FROM product p
                    LEFT JOIN warehouse w ON w.product_id = p.id
                    LEFT JOIN branch b ON b.id = w.branch_id
                    LEFT JOIN order_detail od ON od.product_id = p.id
                    LEFT JOIN orders o ON o.id = od.order_id
                    LEFT JOIN order_status_history osh ON osh.order_id = o.id
                    LEFT JOIN purchase_order_detail pod ON pod.product_id = p.id
                    LEFT JOIN purchase_order po ON po.id = pod.order_id
                    LEFT JOIN purchase_order_status_history posh ON posh.order_id = po.id and posh.branch_id = b.id
                    LEFT JOIN product_unit pu ON pu.id = p.unit_id
                    LEFT JOIN product parent ON parent.id = p.parent_id
                    LEFT JOIN product child ON child.parent_id = p.id
                    WHERE b.seller_id = ? and (? IS NULL OR b.id = ?) AND (p.parent_id != 0 OR child.id IS NULL)  AND (? IS NULL OR CONCAT_WS(' ', p.name, parent.name, p.code) LIKE '${'%'+ search+ '%'}' )
                    GROUP BY p.id, p.code, p.name, pu.name, w.quantity, p.price_import
                    ORDER BY b.id ASC
                    ${(limit && page) ? ` LIMIT ${limit} OFFSET ${(page - 1) * limit}` : ''}
                )

                SELECT JSON_OBJECT(
                    'ten_kho', branch_name,
                    'tong_gia_tri_nhap_kho', COALESCE(SUM(gia_tri_nhap_kho), 0),
                    'tong_so_luong_nhap_kho', COALESCE(SUM(so_luong_nhap_kho), 0),
                    'tong_so_luong_nhap_kho', COALESCE(SUM(so_luong_nhap_kho), 0),
                    'tong_gia_tri_xuat_kho', COALESCE(SUM(gia_tri_xuat_kho), 0),
                    'tong_so_luong_xuat_kho', COALESCE(SUM(so_luong_xuat_kho), 0),
                    'tong_gia_tri_nhap_kho_dau_ky', COALESCE(SUM(gia_tri_nhap_kho_dau_ky), 0),
                    'tong_so_luong_nhap_kho_dau_ky', COALESCE(SUM(so_luong_nhap_kho_dau_ky), 0),
                    'tong_gia_tri_cuoi_ky', COALESCE(SUM(gia_tri_cuoi_ky), 0),
                    'tong_so_luong_cuoi_ky', COALESCE(SUM(so_luong_cuoi_ky), 0),
                    'danh_sach_san_pham', JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'branch_name', branch_name,
                            'product_id', product_id,
                            'code', code,
                            'product_name', product_name,
                            'parent_name', parent_name,
                            'parent_id', parent_id,
                            'unit_name', unit_name,
                            'gia_tri_xuat_kho', gia_tri_xuat_kho, 
                            'so_luong_xuat_kho', so_luong_xuat_kho,
                            'gia_tri_cuoi_ky', gia_tri_cuoi_ky, 'so_luong_cuoi_ky', so_luong_cuoi_ky,
                            'gia_tri_nhap_kho', gia_tri_nhap_kho, 'so_luong_nhap_kho', so_luong_nhap_kho,
                            'gia_tri_nhap_kho_dau_ky', gia_tri_nhap_kho_dau_ky, 'so_luong_nhap_kho_dau_ky', so_luong_nhap_kho_dau_ky
                        )
                    )
                ) AS result
                FROM ProductData;
          `;
            let pagination: IPagiantion = {
                page: page || 1,
                limit: limit || 10,
                totalPage: 0
            }
            const totalPages = Math.ceil(count.length / limit);
            if (Array.isArray(count) && count.length > 0)
                pagination.totalPage = totalPages

            const results = await database.executeQuery(query, [seller_id, branchId || null, branchId || null, search || null]) as RowDataPacket;
            const result = JSON.parse(results[0].result)
           //console.log(result)
            if (result.danh_sach_san_pham) {
                return {
                    data: { ...result, ten_kho: branchId ? result.ten_kho : "Tất cả kho" },
                    pagination
                };
            }
            else {
                return {
                    data: { ...result, ten_kho: branchId ? result.ten_kho : "Tất cả kho", danh_sach_san_pham: [] },
                    pagination
                }
            }
        } catch (error) {
            console.error(error);
            return new HttpException(500, errorMessages.FAILED);
        }
    }

    public getMaterialDetails = async (branchId: number, product_id: number, seller_id: number, page: number, limit: number, fromDate: string, toDate: string) => {
        if (!product_id) {
            return new HttpException(400, errorMessages.MISSING_DATA, 'product_id')
        }
        if (fromDate != undefined && toDate != undefined) {
            fromDate = Time.addTimeIfMissing(fromDate, '00:00:00');
            toDate = Time.addTimeIfMissing(toDate, '23:59:59');
        }
        try {
            const countQuery = `
                        SELECT
                            p.id AS product_id
                        FROM product p
                        LEFT JOIN warehouse w ON w.product_id = p.id
                        LEFT JOIN branch b ON b.id = w.branch_id
                        LEFT JOIN purchase_order_detail pod ON pod.product_id = p.id
                        LEFT JOIN purchase_order po ON po.id = pod.order_id
                        LEFT JOIN purchase_order_status_history posh ON posh.order_id = po.id and posh.branch_id = b.id
                        WHERE pod.product_id = ? 
                        AND (? IS NULL OR b.id = ?) 
                        AND posh.status IN ('hoan_thanh', 'khoi_tao_san_pham')
                        ${(fromDate != undefined && toDate != undefined) ? ` AND po.created_at BETWEEN '${fromDate}' AND '${toDate}' ` : '' }
                        GROUP BY po.id, po.created_at, po.code, p.id, posh.status, b.id, pod.inventory, p.price, pod.price

                        UNION ALL

                        SELECT 
                            p.id
                        FROM delivery_note_detail dnd
                        LEFT JOIN delivery_note dn on dn.id = dnd.delivery_note_id
                        LEFT JOIN branch b ON b.id = dnd.branch_id
                        LEFT JOIN product p ON p.id = dnd.product_id
                        WHERE dnd.product_id = ? 
                        AND (? IS NULL OR dnd.branch_id = ?)
                        ${(fromDate != undefined && toDate != undefined) ? ` AND dnd.created_at BETWEEN '${fromDate}' AND '${toDate}' ` : '' }   
                `
            const count = await database.executeQuery(countQuery, [product_id, branchId || null, branchId || null, product_id, branchId || null, branchId || null]) as RowDataPacket
            console.log(count)
            const query = `
                    WITH Data AS (
                        SELECT
                            pod.price as gia_nhap,
                            po.created_at as ngay_tao_phieu,
                            po.code as ma_chung_tu,
                            b.id AS branch_id, 
                            p.id AS product_id,
                            CASE
                                WHEN po.type = 'import-warehouse-transfer' THEN 'Nhập kho chuyển'
                                WHEN po.type = 'import-warehouse-buy' THEN 'Nhập kho mua hàng'
                                WHEN po.type = 'import-warehouse-beginning' THEN 'Số dư đầu kỳ'
                            END AS action,
                            0 AS so_luong_xuat,
                            0 AS gia_tri_xuat,
                            pod.inventory AS so_luong_ton,
                            pod.inventory * p.price AS gia_tri_ton,
                            COALESCE(SUM(DISTINCT CASE WHEN posh.status = 'hoan_thanh' THEN pod.quantity END), 0) -
                            COALESCE(
                                GREATEST(SUM(CASE WHEN posh.status = 'hoan_thanh' THEN pod.quantity END), 0) -
                                GREATEST(SUM(CASE WHEN posh.status = 'khoi_tao_san_pham' THEN pod.quantity END), 0), 0
                            ) AS so_luong_nhap,

                            (COALESCE(SUM(DISTINCT CASE WHEN posh.status = 'hoan_thanh' THEN pod.quantity END), 0) -
                            COALESCE(
                                GREATEST(SUM(CASE WHEN posh.status = 'hoan_thanh' THEN pod.quantity END), 0) -
                                GREATEST(SUM(CASE WHEN posh.status = 'khoi_tao_san_pham' THEN pod.quantity END), 0), 0
                            )) * pod.price AS gia_tri_nhap
                        FROM product p
                        LEFT JOIN warehouse w ON w.product_id = p.id
                        LEFT JOIN branch b ON b.id = w.branch_id
                        LEFT JOIN purchase_order_detail pod ON pod.product_id = p.id
                        LEFT JOIN purchase_order po ON po.id = pod.order_id
                        LEFT JOIN purchase_order_status_history posh ON posh.order_id = po.id and posh.branch_id = b.id
                        WHERE pod.product_id = ? 
                        AND (? IS NULL OR b.id = ?) 
                        AND posh.status IN ('hoan_thanh', 'khoi_tao_san_pham')
                        ${(fromDate != undefined && toDate != undefined) ? ` AND po.created_at BETWEEN '${fromDate}' AND '${toDate}' ` : '' }
                        GROUP BY po.id, po.created_at, po.code, p.id, posh.status, b.id, pod.inventory, p.price, pod.price

                        UNION ALL

                        SELECT 
                           	0,
                            dnd.created_at,
                            dn.code,
                            b.id, 
                            p.id, 
                            CASE
                                WHEN dn.type = 'xuat_kho_chuyen' THEN 'Xuất kho chuyển'
                                WHEN dn.type = 'xuat_kho_ban_le' THEN 'Xuất kho bán lẻ'
                                WHEN dn.type = 'xuat_kho_trong_ky' THEN 'Xuất kho trong kỳ'
                            END, 
                            dnd.qty, 
                            dnd.qty * p.price,
                            dnd.inventory, 
                            dnd.inventory * p.price,
                            0, 0
                        FROM delivery_note_detail dnd
                        LEFT JOIN delivery_note dn on dn.id = dnd.delivery_note_id
                        LEFT JOIN branch b ON b.id = dnd.branch_id
                        LEFT JOIN product p ON p.id = dnd.product_id
                        WHERE dnd.product_id = ? 
                        AND (? IS NULL OR dnd.branch_id = ?)
                        ${(fromDate != undefined && toDate != undefined) ? ` AND dnd.created_at BETWEEN '${fromDate}' AND '${toDate}' ` : '' }   
                        ORDER BY branch_id, ngay_tao_phieu
                        ${(limit && page) ? `LIMIT ${limit} OFFSET ${(page - 1) * limit}` : ''}       

                    )
                    SELECT JSON_OBJECT(
                        'tong_so_luong_nhap', 
                            IFNULL((
                                select sum(pod.quantity) from purchase_order_detail pod 
                                left join purchase_order_status_history posh on posh.order_id = pod.order_id
                                where pod.product_id = p.id and posh.status = 'hoan_thanh' and posh.branch_id = b.id), 0) - 
                            IFNULL((
                                select sum(pod.quantity) from purchase_order_detail pod 
                                left join purchase_order_status_history posh on posh.order_id = pod.order_id
                                where pod.product_id = p.id and posh.status = 'khoi_tao_san_pham' and posh.branch_id = b.id), 0),
                        'tong_gia_tri_nhap', 
                            (IFNULL((
                                select sum(pod.quantity) from purchase_order_detail pod 
                                left join purchase_order_status_history posh on posh.order_id = pod.order_id
                                where pod.product_id = p.id and posh.status = 'hoan_thanh' and posh.branch_id = b.id), 0) - 
                            IFNULL((
                                select sum(pod.quantity) from purchase_order_detail pod 
                                left join purchase_order_status_history posh on posh.order_id = pod.order_id
                                where pod.product_id = p.id and posh.status = 'khoi_tao_san_pham' and posh.branch_id = b.id), 0)) * gia_nhap,
                        'tong_so_luong_xuat', IFNULL((
                            select sum(dnd.qty) from delivery_note_detail dnd 
                            where dnd.product_id = p.id  and dnd.branch_id = b.id), 0),
                        'tong_gia_tri_xuat', IFNULL((
                            select sum(dnd.qty) from delivery_note_detail dnd 
                            where dnd.product_id = p.id  and dnd.branch_id = b.id), 0) * p.price,
                        'tong_so_luong_ton', w.quantity,
                        'tong_gia_tri_ton', w.quantity * p.price,
                        'ten_kho', b.name,
                        'mat_hang', p.name,
                        'ma_mat_hang', p.code,
                        'danh_sach_san_pham', JSON_ARRAYAGG( 
                            DISTINCT 
                            JSON_OBJECT(
                                'action', action,
                                'ten_kho', b.name,
                                'mat_hang', p.name,
                                'ngay_tao_phieu', ngay_tao_phieu,
                                'ma_chung_tu', ma_chung_tu,
                                'DVT', pu.name,
                                'don_gia', IF(action = 'xuat_kho', p.price, p.price_import),
                                'so_luong_xuat', so_luong_xuat,
                                'gia_tri_xuat', gia_tri_xuat,
                                'so_luong_ton', so_luong_ton,
                                'gia_tri_ton', gia_tri_ton,
                                'so_luong_nhap', so_luong_nhap,
                                'gia_tri_nhap', gia_tri_nhap
                            ) ORDER BY Data.ngay_tao_phieu ASC
                        )
                    ) AS result
                    FROM Data
                    LEFT JOIN branch b ON Data.branch_id = b.id
                    LEFT JOIN product p ON Data.product_id = p.id
                    LEFT JOIN product_unit pu ON pu.id = p.unit_id
                    LEFT JOIN warehouse w ON w.product_id = p.id
                    ${branchId ? `where w.branch_id = ${branchId}` : ''}
          `;
            let pagination: IPagiantion = {
                page: page || 1,
                limit: limit || 10,
                totalPage: 0
            }
            const totalPages = Math.ceil(count.length / limit);
            if (Array.isArray(count) && count.length > 0)
                pagination.totalPage = totalPages

            const results = await database.executeQuery(query, [product_id, branchId || null, branchId || null, product_id, branchId || null, branchId || null]) as RowDataPacket;
            console.log('results', results[0].result)
            let result = JSON.parse(results[0].result)

            if (result.danh_sach_san_pham) {
                const hasOpeningBalance = result.danh_sach_san_pham.some((item: any) => item.action === "Số dư đầu kỳ");
                if (hasOpeningBalance) {
                    const firstNhapKhoIndex = result.danh_sach_san_pham.findIndex((item: any) => item.action === "Số dư đầu kỳ");
                    if (firstNhapKhoIndex !== -1) {
                        result.danh_sach_san_pham.splice(firstNhapKhoIndex + 1, 1);
                    }
                }
                return {
                    data: { ...result, ten_kho: branchId ? result.ten_kho : "Tất cả kho" },
                    pagination
                };
            }
            else {
                return {
                    data: { ...result, ten_kho: branchId ? result.ten_kho : "Tất cả kho", danh_sach_san_pham: [] },
                    pagination
                }
            }
        } catch (error) {
            console.error(error);
            return new HttpException(500, errorMessages.FAILED);
        }
    }

    public getAvailableQuantity = async (product_id: number, branch_id: number[], seller_id: number, not_in_order?: number[], not_in_delivery_note?: number[]) => {
        const query = `
            SELECT 
                COALESCE(SUM(w.quantity), 0) - 
                COALESCE((
                    WITH DATA AS (
                        SELECT od.product_id, od.quantity, od.price
                        FROM orders o 
                        LEFT JOIN order_detail od ON o.id = od.order_id
                        WHERE (o.status <= 3 or o.status = 7) 
                        AND od.product_id = ?   
                        ${branch_id && branch_id.length > 0 ? `AND o.branch_id IN (${branch_id})` : ''}
                        AND o.seller_id = ?
                        ${not_in_order && not_in_order.length > 0 ? ` AND o.id NOT IN (${not_in_order}) ` : ' '}
                    )
                    SELECT sum(quantity) as count from DATA
                ), 0) -
                COALESCE((
                    SELECT SUM(dnd.qty) 
                    FROM delivery_note dn 
                    LEFT JOIN delivery_note_detail dnd ON dn.id = dnd.delivery_note_id 
                    WHERE dn.status = "cho_xuat"
                    AND dnd.product_id = w.product_id
                    ${branch_id && branch_id.length > 0 ? `AND dn.from_branch IN (${branch_id})` : ''}
                    AND dn.seller_id = w.seller_id
                    ${not_in_delivery_note && not_in_delivery_note.length > 0 ? ` AND dn.id NOT IN (${not_in_delivery_note}) ` : ' '}
                ), 0) AS available
            FROM warehouse w
            WHERE w.product_id = ? AND w.seller_id = ? ${branch_id && branch_id.length > 0 ? `AND w.branch_id IN (${branch_id})` : ''}`
        const result = await database.executeQuery(query, [product_id, seller_id, product_id, seller_id]) as RowDataPacket
        return {
            data: result[0].available
        }
    }
}
export default WarehouseService;