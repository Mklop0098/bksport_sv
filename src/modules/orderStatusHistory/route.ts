import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { OrderStatusController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";

class OrderStatusRoute implements IRoute {
    public path = '/order-status-history';
    public router = Router();

    public controller = new OrderStatusController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), this.controller.create);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById);
        this.router.get(this.path + '/findLastestById/:orderId', AuthMiddleware.authorization(true), this.controller.findOrderStatusLastestByOrderId);
        this.router.get(this.path + '/findAllOrderStatusById/:orderId', AuthMiddleware.authorization(true), this.controller.findAllOrderStatusByOrderId);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows);
        this.router.put(this.path + '/update-list-publish', AuthMiddleware.authorization(true), this.controller.updateListPublish);
        this.router.put(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete);
        this.router.put(this.path + '/update-order-status/:orderId', AuthMiddleware.authorization(true), this.controller.updateOrderStatus);
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(true), this.controller.updatePublish);
    }
}

export default OrderStatusRoute;