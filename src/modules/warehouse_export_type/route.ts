import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { WarehouseExportTypeController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";
class WarehouseExportTypeRoute implements IRoute {
    public path = '/export-type';
    public router = Router();

    public controller = new WarehouseExportTypeController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {        
        this.router.get(this.path + '/', AuthMiddleware.authorization(), this.controller.getAllType);
        // this.router.get(this.path + '/inventories/:id', AuthMiddleware.authorization(), this.controller.getAllInventory);
    }
}

export default WarehouseExportTypeRoute   