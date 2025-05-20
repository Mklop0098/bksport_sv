import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { OrdersBookingController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class OrdersBookingRoute implements IRoute {
    public path = '/orders-booking';
    public router = Router();

    public OrdersBookingController = new OrdersBookingController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/getAllOrdersBooking/:id', AuthMiddleware.authorization(true), this.OrdersBookingController.getAllOrdersBooking);
        this.router.patch(this.path + '/:id', AuthMiddleware.authorization(), this.OrdersBookingController.updateStatusPayment);
        this.router.post(this.path + '/', AuthMiddleware.authorization(), this.OrdersBookingController.create);
        this.router.get(this.path + '/', AuthMiddleware.authorization(), this.OrdersBookingController.search);
        this.router.put(this.path + '/update-list-status', AuthMiddleware.authorization(), this.OrdersBookingController.updateListStatus);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(), this.OrdersBookingController.findById);
        this.router.put(this.path + '/update/:id', AuthMiddleware.authorization(), this.OrdersBookingController.update);
    }
}

export default OrdersBookingRoute   