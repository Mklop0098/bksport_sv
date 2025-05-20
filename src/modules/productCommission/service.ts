import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import xlsx from 'xlsx';
import { IError, IPagiantion } from "@core/interfaces";

class ProductCommissionService {
    private tableName = 'product_commission';
    public create = async (model: CreateDto) => {
        const created_at = new Date()
        const updated_at = new Date()
        const result = await database.executeQuery(`insert into ${this.tableName} (product_id, commission, publish, created_id, created_at, updated_at, seller_id) values (?, ?, ?, ?, ?, ?, ?)`, [model.product_id, model.commission || 0, model.publish || 1, model.created_id || null, created_at, updated_at, model.seller_id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED)
        return {
            data: {
                id: (result as any).insertId,
                ...model,
                created_at: created_at,
                updated_at: updated_at,
            }
        }
    }
    public update = async (model: CreateDto, id: number) => {
        const update_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const exist = await checkExist(this.tableName, 'product_id', Number(id))
        if (exist.length > 0) {
            let query = `update ${this.tableName} set `;
            let params = [];
            if (model.publish != undefined) {
                query += `publish = ?, `;
                params.push(model.publish || 1);
            }
            if (model.commission != undefined) {
                query += `commission = ?, `;
                params.push(Number(model.commission) || 0)
            }
            if (model.product_id != undefined) {
                query += `product_id = ?, `;
                params.push(model.product_id)
            }
            if (model.created_id != undefined) {
                query += `created_id = ?, `;
                params.push(model.created_id || null)
            }
            if(model.seller_id != undefined) {
                query += `seller_id = ?, `;
                params.push(model.seller_id)
            }
            query += `updated_at = ? where product_id = ?`;
            params.push(update_at);
            params.push(id);
            const result = await database.executeQuery(query, params);
            if ((result as any).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
        } 
        else {
            let query = `INSERT INTO ${this.tableName} (product_id, commission, publish, created_id, seller_id) VALUE (?, ?, ?, ?, ?)`
            const result = await database.executeQuery(query, [id, model.commission, model.publish || 1, model.created_id || null, model.seller_id])
            if ((result as any).affectedRows === 0)
                return new HttpException(400, errorMessages.CREATE_FAILED)
        }
        return {
            data: {
                id: id,
                ...model,
                updated_at: update_at
            }
        }
    }
    public delete = async (id: number) => {
        if (!await checkExist(this.tableName, 'id', id.toString()))
            return new HttpException(400, errorMessages.GROUP_NOT_EXISTED, 'id');
        const result = await database.executeQuery(`delete from ${this.tableName} where id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: id
        }
    }
    public deleteByProductId = async (product_id: number) => {
        if (!await checkExist(this.tableName, 'product_id', product_id.toString()))
            return new HttpException(400, errorMessages.GROUP_NOT_EXISTED, 'product_id');
        const result = await database.executeQuery(`delete from ${this.tableName} where product_id = ?`, [product_id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: product_id
        }
    }
    public findById = async (id: number) => {
        const result = await checkExist(this.tableName, 'id', id.toString());
        if (result == false)
            return new HttpException(400, errorMessages.GROUP_NOT_EXISTED);
        return {
            data: (result as any)[0]
        }
    }

    public searchs = async (key?: string, product_id?: number, publish?: boolean, page?: number, limit?: number, commission?: number, seller_id?: number) => {
        let query = `select * from ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;

        if (publish != undefined) {
            query += ` and publish = ${publish}`
            countQuery += ` and publish = ${publish}`
        }
        if (product_id != undefined) {
            query += ` and product_id = ${product_id}`
            countQuery += ` and product_id = ${product_id}`
        }
        if (commission != undefined) {
            query += ` and commission = ${commission}`
            countQuery += ` and commission = ${commission}`
        }
        if(seller_id != undefined) {
            query += ` and seller_id = ${seller_id}`
            countQuery += ` and seller_id = ${seller_id}`
        }
        query += ` order by id desc`
        if (page && page < 1 || page && limit! < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (page && limit)
            query = query + ` LIMIT ` + limit + ` OFFSET ` + (page - 1) * limit;
        let pagination: IPagiantion = {
            page: page,
            limit: limit,
            totalPage: 0
        }
        const count = await database.executeQuery(countQuery);
        const totalPages = Math.ceil((count as RowDataPacket[])[0].total / limit!);
        if (Array.isArray(count) && count.length > 0)
            pagination.totalPage = totalPages
        const result = await database.executeQuery(query);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.NOT_FOUND);
        return {
            data: result,
            pagination: pagination
        }
    }
    public updatePublish = async (id: number) => {
        try {
            let result = null;
            let publish = 0
            const update_at = new Date()
            const getPublish = await database.executeQuery(`select publish from ${this.tableName} where id = ?`, [id]);
            if ((getPublish as RowDataPacket[]).length === 0)
                return new HttpException(400, errorMessages.NOT_FOUND, 'id');
            if ((getPublish as RowDataPacket[])[0].publish == 0) {
                publish = 1
                result = await database.executeQuery(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publish, update_at, id]);
            }
            if ((getPublish as RowDataPacket[])[0].publish == 1) {
                result = await database.executeQuery(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publish, update_at, id]);
            }
            return {
                data: {
                    id: id,
                    publish: publish,
                    updated_at: update_at
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
            data: {
                message: errorMessages.DELETE_SUCCESS
            }
        }
    }
    public updateListPublish = async (data: number[], publish: number) => {
        try {
            let result = null;
            const update_at = new Date()
            let query = `update ${this.tableName} set publish = ?, updated_at = ? where id in (${data})`
            result = await database.executeQuery(query, [publish, update_at]);
            return {
                data: {
                    publish: publish,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    private addToErrors = (info: IError, errors: IError[], STT: string, newMsg: string) => {
        const existingError = errors.find(err => err.STT == STT);
        if (existingError) {
            existingError.Msg += `, ${newMsg}`;
        } else {
            info.STT = STT;
            info.Msg = newMsg;
            errors.push({ ...info });
        }
    };
    public convertExcelDateToDate = (value: any): Date | null => {
        if (value instanceof Date)
            return value
        if (typeof value === 'string') {
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date
        }
        if (typeof value === 'number') {
            const excelStartDate = new Date(1899, 11, 30);
            return new Date(excelStartDate.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
        }
        return null;
    }

    public formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${year}-${month}-${day}`
    }
    // public formatPrice = (price: string): number => {
    //     return parseFloat(price.replace(/,/g, ''))
    // }
    public formatPrice = (price: string): number => {
        let cleanPrice = price.replace('%', '').trim();
        return parseFloat(cleanPrice);
    }

    public importExcel = async (file: any, created_id: number) => {
        if (!file) {
            return new HttpException(400, errorMessages.FILE_NOT_FOUND, 'file');
        }
        const workBook = xlsx.read(file.buffer, { type: 'buffer' })
        const sheetName = workBook.SheetNames[0];
        const sheet = workBook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { raw: false });
        const dataFiltered: any[] = [];
        let errors: IError[] = []
        let code = ''
        const rowCount = data.length
        const maxRows = 1000
        if (rowCount > maxRows)
            return new HttpException(400, errorMessages.MAX_ROW_EXCEL + ` ${maxRows} dòng.`);
        let results: any[] = [];
        try {
            data.forEach((element: any, i: number) => {
                let index = i + 1;
                let STT = (index + 1).toString();
                code = element['Mã SKU*'] ? element['Mã SKU*'].toString() : '';
                let commission_excel = element['CK Lương'] ? element['CK Lương'].toString() : '';
                let commission = this.formatPrice(commission_excel)

                dataFiltered.push({
                    STT, code, commission
                });
            });
            for (let i = 0; i < dataFiltered.length; i++) {
                let info: IError = {
                    STT: '',
                    Msg: ''
                };
                let product_id = 0
                if (dataFiltered[i]['code'] != '') {
                    const check = await checkExist('product', 'code', dataFiltered[i]['code']);
                    if (check == false) {
                        this.addToErrors(info, errors, dataFiltered[i]['STT'], errorMessages.PRODUCT_NOT_EXISTED)
                    } else {
                        //check product id
                        const checkProductId = await checkExist('product_commission', 'product_id', check[0].id.toString());
                        if (checkProductId != false) {
                            // this.addToErrors(info, errors, dataFiltered[i]['STT'], errorMessages.PRODUCT_COMMISSION_EXISTED)
                            //update commission
                            const update_at = new Date();
                            let query = `update product_commission set commission = ?, updated_at = ? where product_id = ?`;
                            const values = [
                                dataFiltered[i]['commission'],
                                update_at,
                                check[0].id
                            ];
                            const result = await database.executeQuery(query, values);
                            if ((result as any).affectedRows > 0) {
                                let data = {
                                    id: (result as any).insertId,
                                    ...dataFiltered[i],
                                    created_id: created_id,
                                    created_at: update_at,
                                }
                                results.push(data);
                            }
                        } else {
                            product_id = check[0].id;
                        }
                    }
                }
                if (info.Msg == null || info.Msg == '' && product_id != 0) {
                    try {
                        const created_at = new Date()
                        let query = `INSERT INTO ${this.tableName} (product_id, commission, publish, created_id, created_at) VALUES (?, ?, ?, ?, ?)`;
                        const values = [
                            product_id,
                            dataFiltered[i]['commission'],
                            1,
                            created_id || null,
                            created_at,
                        ];
                        const result = await database.executeQuery(query, values);
                        if ((result as any).affectedRows > 0) {
                            let data = {
                                id: (result as any).insertId,
                                ...dataFiltered[i],
                                created_id: created_id,
                                created_at: created_at,
                            }
                            results.push(data);
                        }

                    } catch (error) {
                        this.addToErrors(info, errors, dataFiltered[i]['STT'], errorMessages.CREATE_FAILED);
                    }
                } else {
                    // errors.push(info);
                }
            }
            return {
                message: `Tổng số dòng: ${dataFiltered.length}, Số dòng thêm thành công: ${results.length}, Số dòng thất bại: ${dataFiltered.length - results.length}`,
                total: dataFiltered.length,
                successTotal: results.length,
                failedTotal: errors.length,
                results: results,
                errors: errors
            }
        } catch (error) { }
    }
    public findByProductId = async (product_id: number) => {
        const result = await database.executeQuery(`select * from ${this.tableName} where product_id = ?`, [product_id]);
        if ((result as RowDataPacket[]).length === 0)
            return new HttpException(400, errorMessages.NOT_FOUND, 'product_id');
        return {
            data: (result as RowDataPacket[])[0]
        }
    }
}

export default ProductCommissionService;