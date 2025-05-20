import { Request, Response, NextFunction } from "express";
import CustomerSerivces from "./customer.service";
import { sendResponse } from "@core/utils";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";
import path from "path";
class CustomerController {
    public service = new CustomerSerivces();

    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body;
        model.created_id = req.id;
        model.publish = model.publish ?? 1;
        model.seller_id = req.seller_id;
        try {
            const result = await this.service.create(model);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.delete(id);
            if (result instanceof Error && result.field)
                // return sendResponse(res, result.status, result.message, result.field);
                return sendResponse(res, result.status, result.message, null, result.field);
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
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public searchs = async (req: Request, res: Response, next: NextFunction) => {
        const key: string = req.query.key as any;
        const code: string = req.query.code as any;
        const name: string = req.query.name as any;
        const phone: string = req.query.phone as any;
        const email: string = req.query.email as any;
        const tax_code: string = req.query.tax_code as any;
        const type: number = req.query.type as any;
        const group_id: number = req.query.group_id as any;
        const publish = req.query.publish as any;
        const manager_id: number = req.id as any
        const created_id = req.id as any
        const employee_id = req.query.employee_id as any // loc nguoi phu trach
        const city_id = req.query.city_id as any
        const district_id = req.query.district_id as any
        const ward_id = req.query.ward_id as any
        const gender = req.query.gender as any
        const birthdate = req.query.birthdate as any
        const page = req.query.page as any
        const limit = req.query.limit as any
        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        const seller_id = req.seller_id as any
        const isLocation: any = req.query.isLocation === 'true' ? true : (req.query.isLocation === 'false' ? false : undefined)
        const role_id: any = req.role_id

        try {
            const result = await this.service.searchs(key, code, name, phone, email, tax_code, type, group_id, publish, pageInt, limitInt, manager_id, created_id, employee_id, city_id, district_id, ward_id, gender, birthdate, seller_id, isLocation, role_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public searchsUpdate = async (req: Request, res: Response, next: NextFunction) => {
        const key: string = req.query.key as any;
        const code: string = req.query.code as any;
        const name: string = req.query.name as any;
        const phone: string = req.query.phone as any;
        const email: string = req.query.email as any;
        const tax_code: string = req.query.tax_code as any;
        const type: number = req.query.type as any;
        const group_id: number = req.query.group_id as any;
        const publish = req.query.publish as any;
        const manager_id: number = req.id as any

        const page = req.query.page as any ?? 1;
        const limit = req.query.limit as any ?? 10;

        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        try {
            const result = await this.service.searchsUpdate(key, code, name, phone, email, tax_code, type, group_id, publish, pageInt, limitInt, manager_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateProfile = async (req: Request, res: Response, next: NextFunction) => {
        const customerDto: CreateDto = req.body;
        const id: number = req.params.id as any;
        const created_id = req.id;
        const seller_id = req.seller_id;
        customerDto.seller_id = seller_id;
        try {
            const model = customerDto as any;
            model.created_id = created_id;
            const result = await this.service.updateProfile(model, id);
            if (result instanceof Error && result.field)
                // return sendResponse(res, result.status, result.message, result.field);
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updatePublish = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const model: CreateDto = req.body;
        model.created_id = req.id;
        try {
            const result = await this.service.updatePublish(model, id);
            if (result instanceof Error && result.field)
                // return sendResponse(res, result.status, result.message, result.field);
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public importExcel = async (req: Request, res: Response, next: NextFunction) => {
        const file = req.file;
        const created_id = req.id;
        try {
            const result = await this.service.importExcelUpdate(file, created_id as number);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if ((result as any).message.includes(message.MAX_ROW_EXCEL)) {
                return sendResponse(res, 400, (result as any).message);
            }
            return sendResponse(res, 200, message.IMPORT_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public statistics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const seller_id = req.seller_id as any;
            const result = await this.service.statistics(seller_id);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.STATISTICS_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public deleteRows = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const model: CreateDto = req.body;
        model.created_id = req.id;
        try {
            const result = await this.service.deleteRows(model, listId);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateListPublish = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const publish: number = req.body.publish;
        try {
            const result = await this.service.updateListPublish(listId, publish);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public downloadExcelSample = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const fileNameSample = process.env.EXCEL_CUSTOMER_NAME_SAMPLE! as string || 'nhap-khach-hang.xlsx';
            const userDir = path.resolve(__dirname, process.env.EXCEL_UPLOAD_PATH! as string);
            const file = `${userDir}/${fileNameSample}` as string;
            res.download(file as string);
        } catch (error) {
            next(error);
        }
    }
    public reportCustomerQuantity = async (req: Request, res: Response, next: NextFunction) => {
        const created_id: number = req.id as any;
        const seller_id: number = req.seller_id as any;
        try {
            const result = await this.service.reportCustomerQuantity(created_id, seller_id);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}
export default CustomerController;