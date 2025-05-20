import SupplierController from "./controller";
import { IRoute } from "@core/interfaces";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { Router } from "express";
import { CreateDto } from "./dtos/create.dto";

class WarehouseRoute implements IRoute {
    public path = '/warehouse';
    public router = Router();

    public controller = new SupplierController();

    constructor() {
        this.initializeRoutes();
    }
    
    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), errorMiddleware(CreateDto, 'body', true), this.controller.create)
        this.router.get(this.path + '/',AuthMiddleware.authorization(true), this.controller.searchs)
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById)
        this.router.put(this.path + '/update-list-status', AuthMiddleware.authorization(true), this.controller.updateListSublish);
        this.router.patch(this.path + '/:id', AuthMiddleware.authorization(true), errorMiddleware(CreateDto, 'body', true), this.controller.updateProfile)
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows)
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete)
        this.router.put(this.path + '/update-status/:id', AuthMiddleware.authorization(true), this.controller.updateStatus)
        this.router.get(this.path + '/statistics', AuthMiddleware.authorization(true), this.controller.statistics)
        this.router.post(this.path + '/check-quantity', AuthMiddleware.authorization(true), this.controller.checkQuantity)
        this.router.post(this.path + '/export-warehouse', AuthMiddleware.authorization(true), this.controller.exportWarehouse)
        this.router.get(this.path + '/report-inventories', AuthMiddleware.authorization(true), this.controller.warehousereport)
        this.router.get(this.path + '/report-detail-material', AuthMiddleware.authorization(true), this.controller.warehouseReportDetail)
    }
}

export default WarehouseRoute;   