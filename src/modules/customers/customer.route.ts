import CustomerController from "./customer.controller";
import { IRoute } from "@core/interfaces";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { Router } from "express";
import multer from "multer";
import { CreateDto } from "./dtos/create.dto";

class CustomerRoute implements IRoute {
    public path = '/customers';
    public router = Router();
    public upload = multer({ storage: multer.memoryStorage() });

    public controller = new CustomerController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/export-excel', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), errorMiddleware(CreateDto, 'body', true), this.controller.create)
        this.router.get(this.path + '/searchUpdate', AuthMiddleware.authorization(true), this.controller.searchsUpdate)
        this.router.get(this.path + '/report-my-number-customer', AuthMiddleware.authorization(true), this.controller.reportCustomerQuantity);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs)
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById)
        this.router.put(this.path + '/update-list-publish', AuthMiddleware.authorization(true), this.controller.updateListPublish);
        this.router.patch(this.path + '/:id', AuthMiddleware.authorization(true), errorMiddleware(CreateDto, 'body', true), this.controller.updateProfile)
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows)
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete)
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(true), this.controller.updatePublish)
        this.router.post(this.path + '/import-excel', AuthMiddleware.authorization(true), this.upload.single('file'), this.controller.importExcel)
        this.router.get(this.path + '/statistics', AuthMiddleware.authorization(true), this.controller.statistics)
        this.router.get(this.path + '/download-excel-sample', this.controller.downloadExcelSample);
    }
}

export default CustomerRoute;   