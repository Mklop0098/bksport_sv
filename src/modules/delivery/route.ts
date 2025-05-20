import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { DeliveryController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";
class DeliveryRoute implements IRoute {
    public path = '/delivery';
    public router = Router();

    public controller = new DeliveryController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {        
        // this.router.post(this.path + '/connect-partnership', AuthMiddleware.authorization(), this.controller.connectPartnerShip);
        // this.router.get(this.path + '/inventories/:id', AuthMiddleware.authorization(), this.controller.getAllInventory);
    }
}

export default DeliveryRoute   