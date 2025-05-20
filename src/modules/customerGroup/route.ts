import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { CustomerGroupController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class CustomerGroupRoute implements IRoute {
    public path = '/customer-groups';
    public router = Router();

    public customerGroupController = new CustomerGroupController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.customerGroupController.create);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.customerGroupController.searchs);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.customerGroupController.deleteRows);
        this.router.put(this.path + '/update-list-publish', AuthMiddleware.authorization(true), this.customerGroupController.updateListPublish);
        this.router.patch(this.path + '/:id', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.customerGroupController.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.customerGroupController.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.customerGroupController.findById);
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(true), this.customerGroupController.updatePublish);
        this.router.put(this.path + '/update-is-default/:id', AuthMiddleware.authorization(true), this.customerGroupController.updateIsDefault);
    }
}

export default CustomerGroupRoute   