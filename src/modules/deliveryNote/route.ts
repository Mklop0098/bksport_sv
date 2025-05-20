import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { DeliveryNoteController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";
class DeliveryNoteRoute implements IRoute {
    public path = '/warehouse-export';
    public router = Router();

    public controller = new DeliveryNoteController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(), this.controller.create);
        this.router.put(this.path + '/update-list-status', AuthMiddleware.authorization(true), this.controller.updateListPublish);
        this.router.put(this.path + '/:id', AuthMiddleware.authorization(true), errorMiddleware(CreateDto, 'body', false), this.controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById);
        this.router.get(this.path + '/report-delivery', AuthMiddleware.authorization(true), this.controller.reportDeliveryNoteByCreatedAt);
        this.router.get(this.path + '/report', AuthMiddleware.authorization(true), this.controller.reportDeliveryNote);
        this.router.post(this.path + '/export-list-delivery', AuthMiddleware.authorization(true), this.controller.reportListDelivery);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.post(this.path + '/update-delivery', this.controller.updateDelivery);
    }
}

export default DeliveryNoteRoute   