import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { OrdersBookingDetailController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class OrdersBookingRoute implements IRoute {
    public path = '/orders-booking';
    public router = Router();

    public OrdersBookingDetailController = new OrdersBookingDetailController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/getAllOrdersBookingDetail/:id', AuthMiddleware.authorization(true), this.OrdersBookingDetailController.getAllOrdersBookingDetail);
    }
}

export default OrdersBookingRoute   