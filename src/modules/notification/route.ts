import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { NotificationController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";

class NotificationRoute implements IRoute {
    public path = '/notification';
    public router = Router();

    public controller = new NotificationController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), this.controller.create);
        this.router.get(this.path + '/get-my-notification', AuthMiddleware.authorization(true), this.controller.getNotificationByUserId);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows);
        this.router.put(this.path + '/update-list-status', AuthMiddleware.authorization(true), this.controller.updateListStatus);
        this.router.patch(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById);
        this.router.put(this.path + '/update-status/:id', AuthMiddleware.authorization(true), this.controller.updateStatus);
    }
}

export default NotificationRoute   