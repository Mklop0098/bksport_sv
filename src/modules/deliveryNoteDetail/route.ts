import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { DeliveryNoteDetailController } from "./controller";
import { AuthMiddleware } from "@core/middleware";

class DeliveryNoteDetailRoute implements IRoute {
    public path = '/delivery-note-detail';
    public router = Router();

    public deliveryNoteDetailRoute = new DeliveryNoteDetailController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), this.deliveryNoteDetailRoute.create);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.deliveryNoteDetailRoute.searchs);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.deliveryNoteDetailRoute.deleteRows);
        this.router.patch(this.path + '/:id', AuthMiddleware.authorization(true), this.deliveryNoteDetailRoute.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.deliveryNoteDetailRoute.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.deliveryNoteDetailRoute.findById);
    }
}

export default DeliveryNoteDetailRoute   