import { sendResponse } from "@core/utils";
import ProductService from "./product.service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";
import path from "path";

export class ProductController {
    public productService = new ProductService();

    public createProduct = async (req: Request, res: Response, next: NextFunction) => {

        const listImage = req.files;
        console.log(listImage)
        const model: CreateDto = req.body;
        model.attributes_json = req.body.attributes
        model.sub_products_json = req.body.sub_products
        model.created_id = req.id;
        model.seller_id = req.seller_id;

        try {
            const result = await this.productService.createProductJSON(model, listImage);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result as any);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }

    public updateProduct = async (req: Request, res: Response, next: NextFunction) => {
        const listImage = req.files;
        const model: CreateDto = req.body;
        model.created_id = req.id;
        const id: number = req.params.id as any;
        model.seller_id = req.seller_id as any;
        //console.log("modeewewewel", model);

        try {
            const result = await this.productService.updateProduct(model, id, listImage);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const model: CreateDto = req.body;
        model.created_id = req.id;
        model.seller_id = req.seller_id
        try {
            const result = await this.productService.delete(id, model);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public deleteOneImage = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.productService.deleteOneProductImage(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message)
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public findById = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.productService.findById(id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public findByIdUpdate = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.productService.findByIdUpdate(id);
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
        const publish = req.query.publish as any;
        const code: string = req.query.code as any;
        const is_sell: number = req.query.is_sell as any;
        const product_type_name: string = req.query.product_type_name as any;
        const product_type_id: number = req.query.product_type as any;
        const page = req.query.page as any
        const limit = req.query.limit as any
        const brand_id = req.query.brand_id as any
        const created_id = req.query.created_id as any
        const category_id = req.query.category_id as any
        const { notify, is_authentic, is_freeship, can_return, brand_origin, made_in, publish_yomart } = req.query as any
        const seller_id = req.seller_id as any
        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)

        //console.log(seller_id, req)

        try {
            const result = await this.productService.searchs(key, name, publish, code, pageInt, limitInt, is_sell, product_type_name, product_type_id, brand_id, created_id, category_id, notify, is_authentic, is_freeship, can_return, seller_id, brand_origin, made_in, publish_yomart);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updatePublish = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const model: CreateDto = req.body;
        model.created_id = req.id;
        try {
            const result = await this.productService.updatePublish(model, id)
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }

    public updatePublishYomart = async (req: Request, res: Response, next: NextFunction) => {
        const {listId, publish} = req.body as any
        const create_id = req.id as number
        try {
            const result = await this.productService.updatePublishYomart(listId, publish, create_id)
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }

    public updateListPublish = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const publish: number = req.body.publish;
        try {
            const result = await this.productService.updateListPublish(listId, publish);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public updateListPublishYomart = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const publish: number = req.body.publish;
        try {
            const result = await this.productService.updateListPublishYomart(listId, publish);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public deleteRows = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const model: CreateDto = req.body;
        model.created_id = req.id;
        model.seller_id = req.seller_id
        try {
            const result = await this.productService.deleteRows(model, listId);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public importExcelUpdate = async (req: Request, res: Response, next: NextFunction) => {
        const file = req.file;
        const created_id = req.id;
        try {
            const result = await this.productService.importExcelUpdate(file, created_id as number);
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
    public downloadExcelSample = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const excel_name_sample = process.env.EXCEL_PRODUCT_NAME_SAMPLE! as string || 'nhap-san-pham.xlsx';
            const userDir = path.resolve(__dirname, process.env.EXCEL_UPLOAD_PATH! as string);
            const file = `${userDir}/${excel_name_sample}` as string;
            res.download(file as string);
        } catch (error) {
            next(error);
        }
    }

    public getAvailableProducts = async (req: Request, res: Response, next: NextFunction) => {
        const { page, limit } = req.query as any
        const { key } = req.query as any
        const seller_id = req.seller_id as any
        const user_id = req.id as any
        try {
            const result = await this.productService.getAvailableProduct(key, seller_id, user_id, page, limit);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getProductsHaveNoBeginningInventory = async (req: Request, res: Response, next: NextFunction) => {
        const { page, limit, key } = req.query as any
        const seller_id = req.seller_id as any  
        const user_id = req.id as any
        try {
            const result = await this.productService.getProductsHaveNoBeginningInventory(key, seller_id, user_id, page, limit);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getProducts = async (req: Request, res: Response, next: NextFunction) => {
        const { page, limit, key } = req.query as any
        const seller_id = req.seller_id as any
        const user_id = req.id as any
        try {
            const result = await this.productService.getProducts(user_id, key, seller_id, page, limit);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getProductWarehouseInfo = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        const user_id = req.id as any
        const seller_id = req.seller_id as any
        try {
            const result = await this.productService.getProductWarehouseInfo(id, user_id, seller_id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getProductWarehouseHistory = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.productService.getProductWarehouseHistory(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public deleteOneProductImage = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.productService.deleteOneProductImage(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }

    public deleteAllProductImage = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.productService.deleteAllImage(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }

    public updateProductImage = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id as any
        const created_id = req.id;
        const files = req.files;
        console.log(files)
        try {
            const result = await this.productService.updateProductImage(id, files, created_id)
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public createNewAttributes = async (req: Request, res: Response, next: NextFunction) => {
        const { attributes } = req.body
        const id = req.params.id as any
        try {
            const result = await this.productService.createNewAttributes(id, attributes);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }

    public updateAttribute = async (req: Request, res: Response, next: NextFunction) => {
        const { name } = req.body
        const id = req.params.id as any
        try {
            const result = await this.productService.updateAttribute(id, name);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error)
        }
    }

    public deleteAttribute = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id as any
        try {
            const result = await this.productService.deleteAttribute(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS);
        } catch (error) {
            next(error)
        }
    }

    public deleteAttributeDetail = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id as any
        const attribute_detail = req.body.attribute_detail as any
       //console.log(attribute_detail)
        try {
            const result = await this.productService.deleteAttributeDetail(id, attribute_detail);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS);
        } catch (error) {
            next(error)
        }
    }

    public updateSubProductImage = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id as any
        const { image } = req.body as any
        const create_id = req.id as any
       //console.log(image, id)
        try {
            const result = await this.productService.updateSubProductImage(image, id, create_id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error)
        }
    }

    public updateSubProduct = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body
        model.sub_product_attributes = JSON.parse(`${req.body.sub_product_attributes}`)
        const id = req.params.id as any
        try {
            const result = await this.productService.updateSubProduct(model, id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error)
        }
    }

    public createSubProduct = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body
        model.sub_product_attributes = JSON.parse(`${req.body.sub_product_attributes}`)
        model.created_id = req.id
        model.seller_id = req.seller_id
        try {
            const result = await this.productService.createSubProduct(model);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS);
        } catch (error) {
            next(error)
        }
    }
    public updateListSubProductImage = async (req: Request, res: Response, next: NextFunction) => {
        const created_id = req.id as number
        const { listId, image } = req.body
        try {
            const result = await this.productService.updateListSubProductImage(listId, image, created_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error)
        }
    }

}