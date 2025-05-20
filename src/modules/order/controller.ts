import { sendResponse } from "@core/utils";
import OrderService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class OrderController {
    public service = new OrderService();
    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body;
        model.created_id = req.id;
        model.order_details = req.body.order_details;
        model.seller_id = req.seller_id as any;
        try {
            const result = await this.service.create(model);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            if (result.data.status && result.data.status == 400) {
                return sendResponse(res, 400, message.UPDATE_FAILED, {errors: result.data.errors});
            }
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.delete(id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public findById = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.findById(id);
            if (result instanceof Error)
                return sendResponse(res, (result as any).status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public reportSaleInvoice = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const seller_id: number = req.seller_id as any;
        try {
            const result = await this.service.reportSaleInvoice(id, seller_id);
            if (result instanceof Error)
                return sendResponse(res, (result as any).status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public findByIdUpdate = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.findByIdUpdate(id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public searchs = async (req: Request, res: Response, next: NextFunction) => {
        const name: string = req.query.name as any;
        const key: string = req.query.key as any;
        const phone = req.query.phone as any;
        const status: number = req.query.status as any;
        const fromDate: string = req.query.fromDate as any;
        const toDate: string = req.query.toDate as any;
        const created_id: number = req.id as any;
        const date: string = req.query.date as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;
        const status_payment: number = req.query.status_payment as any;
        const isFilterQuery: string = req.query.isFilter as any;
        const isFilter: boolean = isFilterQuery === 'true' ? true : false;
        const employee_id: number = req.query.employee_id as any;
        const transaction: boolean = req.query.transaction === 'true' ? true : false;
        const seller_id: number = req.seller_id as any;
        const role_id: number = req.role_id as any
        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        try {
            const result = await this.service.searchs(key, name, phone, pageInt, limitInt, created_id, fromDate, toDate, status, date, status_payment, isFilter, employee_id, transaction, seller_id, role_id);
            if (result instanceof Error)    
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public reportRevenue = async (req: Request, res: Response, next: NextFunction) => {
        const name: string = req.query.name as any;
        const key: string = req.query.key as any;
        const phone = req.query.phone as any;
        const status: number = req.query.status as any;
        const fromDate: string = req.query.fromDate as any;
        const toDate: string = req.query.toDate as any;
        const created_id: number = req.id as any;
        const date: string = req.query.date as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;
        const status_payment: number = req.query.status_payment as any;
        const isFilterQuery: string = req.query.isFilter as any;
        const isFilter: boolean = isFilterQuery === 'true' ? true : false;
        const employee_id: number = req.query.employee_id as any;
        const transaction: boolean = req.query.transaction === 'true' ? true : false;

        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)

        const type_revenue: string = req.query.type_revenue as any;
        const year: number = req.query.year as any;
        const month: number = req.query.month as any;
        
        try {
            const result = await this.service.reportRevenue(key, name, phone, pageInt, limitInt, created_id, fromDate, toDate, status, date, status_payment, isFilter, employee_id, transaction, type_revenue, year, month);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updatePublish = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const publish: number = req.body.publish;
        try {
            const result = await this.service.updatePublish(id, publish);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }
    public deleteRows = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        try {
            const result = await this.service.deleteRows(listId);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public update = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body;
        model.created_id = req.id;
        const id: number = req.params.id as any;
        model.seller_id = req.seller_id
        try {
            const result = await this.service.update(id, model);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public  report = async (req: Request, res: Response, next: NextFunction) => {
        const fromDate: string = req.query.fromDate as any
        const toDate: string = req.query.toDate as any
        const date: string = req.query.date as any
        const created_id: number = req.id as any;
        const seller_id = req.seller_id as number;
        const role_id = req.role_id as number
        try {
            const result = await this.service.report(fromDate, toDate, date, created_id, seller_id, role_id);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public reportOrderByFomDateToDate = async (req: Request, res: Response, next: NextFunction) => {
        const fromDate: string = req.query.fromDate as any
        const toDate: string = req.query.toDate as any
        const status: number = req.query.status as any
        try {
            const result = await this.service.reportOrderByFomDateToDate(fromDate, toDate, status);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateListStatus = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const status: number = req.body.status;
        const created_id: number = req.id as any
        const seller_id: number = req.seller_id as any
        try {
            const result = await this.service.updateListStatus(listId, status, created_id, seller_id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public exportListPDFInvoice = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const seller_id: number = req.seller_id as any;
        try {
            const result = await this.service.exportListPDFInvoice(listId, seller_id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.EXPORT_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateStatusUpdate = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body;
        model.created_id = req.id;
        const id: number = req.params.id as any;
        const satus: number = req.body.status;
        const status_payment: number = req.body.status_payment;
        model.status_payment = status_payment;
        model.status = satus;
        model.seller_id = req.seller_id
       //console.log(req.seller_id)
        try {
            const result = await this.service.updateStatusUpdate(id, model);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public reportDelivery = async (req: Request, res: Response, next: NextFunction) => {
        const name: string = req.query.name as any;
        const key: string = req.query.key as any;
        const phone = req.query.phone as any;
        const status: number = req.query.status as any;
        const fromDate: string = req.query.fromDate as any;
        const toDate: string = req.query.toDate as any;
        const created_id: number = req.id as any;
        const date: string = req.query.date as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;
        const listId: number[] = req.body.listId;
        const status_payment: number = req.query.status_payment as any;
        const isFilterQuery: string = req.query.isFilter as any;
        const isFilter: boolean = isFilterQuery === 'true' ? true : false;
        const employee_id: number = req.query.employee_id as any;
        const seller_id: number = req.seller_id as any;

        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)

       //console.log(req.query)
        try {
            const result = await this.service.reportDelivery(key, name, phone, pageInt, limitInt, created_id, fromDate, toDate, status, date, listId, status_payment, isFilter, employee_id , seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result.data);
        } catch (error) {
            next(error);
        }
    }
    public updateOrder = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body;
        model.created_id = req.id;
        const id: number = req.params.id as any;
        model.seller_id = req.seller_id
        try {
            const result = await this.service.updateOrder(id, model);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            if (result.data.status && result.data.status == 400) {
                return sendResponse(res, 400, message.UPDATE_FAILED, {errors: result.data.errors});
            }
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateListStatusPayment = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const status_payment: number = req.body.status_payment;
        
        try {
            const result = await this.service.updateListStatusPayment(listId, status_payment);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public findAllCommission = async (req: Request, res: Response, next: NextFunction) => {
        const name: string = req.query.name as any;
        const key: string = req.query.key as any;
        const phone = req.query.phone as any;
        const status: number = req.query.status as any;
        const fromDate: string = req.query.fromDate as any;
        const toDate: string = req.query.toDate as any;
        const created_id: number = req.id as any;
        const date: string = req.query.date as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;
        const status_payment: number = req.query.status_payment as any;
        const isFilterQuery: string = req.query.isFilter as any;
        const isFilter: boolean = isFilterQuery === 'true' ? true : false;
        const employee_id: number = req.query.employee_id as any;

        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        try {
            const result = await this.service.findAllCommission(key, name, phone, pageInt, limitInt, created_id, fromDate, toDate, status, date, status_payment, isFilter, employee_id);
            // if (result instanceof Error)
            // //console.log("result", result);

            // return sendResponse(res, result.status, result.message);
            // return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public findAllCommissionByCreatedId = async (req: Request, res: Response, next: NextFunction) => {
        const created_id: number = req.query.id as any;
        const name: string = req.query.name as any;
        const key: string = req.query.key as any;
        const phone = req.query.phone as any;
        const status: number = req.query.status as any;
        const fromDate: string = req.query.fromDate as any;
        const toDate: string = req.query.toDate as any;
        // const created_id: number = req.id as any;
        const date: string = req.query.date as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;
        const role_id = req.role_id as number
        const user_id = req.id as number
        //console.log("created_id", created_id);
        //console.log(fromDate, toDate);



        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        try {
            const result = await this.service.findAllCommissionByCreatedId(key, name, phone, pageInt, limitInt, created_id, fromDate, toDate, status, date, role_id, user_id);
            // if (result instanceof Error && result.field)
            // return sendResponse(res, result.status, result.message);
            // if (result instanceof Error)
            // return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public findAllCommissionProductByCreatedId = async (req: Request, res: Response, next: NextFunction) => {
        const created_id: number = req.query.id as any;
        const name: string = req.query.name as any;
        const key: string = req.query.key as any;
        const phone = req.query.phone as any;
        const status: number = req.query.status as any;
        const fromDate: string = req.query.fromDate as any;
        const toDate: string = req.query.toDate as any;
        // const created_id: number = req.id as any;
        const date: string = req.query.date as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;

        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        try {
            const result = await this.service.findAllCommissionProductByCreatedId(key, name, phone, pageInt, limitInt, created_id, fromDate, toDate, status, date);
            // if (result instanceof Error && result.field)
            // return sendResponse(res, result.status, result.message);
            // if (result instanceof Error)
            // return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public reportOrderQuantity = async (req: Request, res: Response, next: NextFunction) => {
        const created_id: number = req.id as any;
        try {
            const result = await this.service.reportOrderQuantity(created_id);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public reportOrderQuantityByCreatedId = async (req: Request, res: Response, next: NextFunction) => {
        const name: string = req.query.name as any;
        const key: string = req.query.key as any;
        const phone = req.query.phone as any;
        const status: number = req.query.status as any;
        const fromDate: string = req.query.fromDate as any;
        const toDate: string = req.query.toDate as any;
        const created_id: number = req.id as any;
        const date: string = req.query.date as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;
        const status_payment: number = req.query.status_payment as any;
        const isFilterQuery: string = req.query.isFilter as any;
        const isFilter: boolean = isFilterQuery === 'true' ? true : false;
        const employee_id: number = req.query.employee_id as any;
        const transaction: boolean = req.query.transaction === 'true' ? true : false;

        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        try {
            const result = await this.service.reportOrderQuantityByCreatedId(key, name, phone, pageInt, limitInt, created_id, fromDate, toDate, status, date, status_payment, isFilter, employee_id, transaction);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public reportRevenueMonthOfYear = async (req: Request, res: Response, next: NextFunction) => {
        
        const seller_id: number = req.seller_id as any;
        const created_id: number = req.id as any;
        const role_id: number = req.role_id as any
        const year: number = req.query.year as any;
        const month: number = req.query.month as any;
       //console.log(created_id, seller_id, role_id)
        try {
            const result = await this.service.reportRevenueMonthOfYear(created_id, role_id, seller_id);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public reportRevenueAndSalaryMonthOfYear = async (req: Request, res: Response, next: NextFunction) => {
        
        const seller_id: number = req.seller_id as any;
        const created_id: number = req.id as any;
        const role_id: number = req.role_id as any
        const year: number = req.query.year as any;
        const month: number = req.query.month as any;
       //console.log(created_id, seller_id, role_id)
        try {
            const result = await this.service.reportRevenueAndSalaryMonthOfYear(created_id, role_id, seller_id, month, year);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public optimize = async (req: Request, res: Response, next: NextFunction) => {
        const name: string = req.query.name as any;
        const key: string = req.query.key as any;
        const phone = req.query.phone as any;
        const status: number = req.query.status as any;
        const fromDate: string = req.query.fromDate as any;
        const toDate: string = req.query.toDate as any;
        const created_id: number = req.id as any;
        const date: string = req.query.date as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;
        const status_payment: number = req.query.status_payment as any;
        const isFilterQuery: string = req.query.isFilter as any;
        const isFilter: boolean = isFilterQuery === 'true' ? true : false;
        const employee_id: number = req.query.employee_id as any;
        const transaction: boolean = req.query.transaction === 'true' ? true : false;
        const seller_id: number = req.seller_id as any;

        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        try {
            const result = await this.service.searchs(key, name, phone, pageInt, limitInt, created_id, fromDate, toDate, status, date, status_payment, isFilter, employee_id, transaction, seller_id);
            if (result instanceof Error)    
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public checkQty = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const {order_details} = req.body as any
       //console.log(id, order_details)
        try {
            const result = await this.service.checkOrderQuantity(id, order_details);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            if (result && result.data.status && result.data.status == 400) {
                return sendResponse(res, 400, message.UPDATE_FAILED, {errors: result.data.errors});
            }
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }

    public checkCanDelivery = async (req: Request, res: Response, next: NextFunction) => {
        const listOrderId: number[] = req.body.listId as any;
       //console.log(listOrderId)     
        try {
            const result = await this.service.checkCanDelivery(listOrderId);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getOrderByListId = async (req: Request, res: Response, next: NextFunction) => {
        const listOrderId: string = req.query.listId as any;
        const listId = JSON.parse(listOrderId || '[]') as number[];
        console.log(listId)
        try {   
            const result = await this.service.getOrderByListId(listId);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public updateDeliveryMethodList = async (req: Request, res: Response, next: NextFunction) => {
        const { delivery_method, shipper_id, ship_key, ship_fee, ship_fee_payer, listId } = req.body
        try {
            const result = await this.service.updateDeliveryMethodList(delivery_method, shipper_id, ship_key, ship_fee, ship_fee_payer, listId);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

}