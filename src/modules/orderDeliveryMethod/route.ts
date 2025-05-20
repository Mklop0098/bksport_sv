import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { OrderDeliveryMethodController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
class OrderDeliveryMethodRoute implements IRoute {
    public path = '/order-delivery-method';
    public router = Router();

    public controller = new OrderDeliveryMethodController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/', this.controller.create)
        this.router.post(this.path + '/', this.controller.update)
    }
}


export default OrderDeliveryMethodRoute;