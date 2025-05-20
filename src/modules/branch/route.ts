import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { BranchController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class BranchRoute implements IRoute {
    public path = '/branch';
    public router = Router();

    public branchController = new BranchController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.branchController.create);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.branchController.searchs);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.branchController.deleteRows);
        this.router.put(this.path + '/update-list-publish', AuthMiddleware.authorization(true), this.branchController.updateListPublish);
        this.router.patch(this.path + '/:id', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.branchController.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.branchController.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.branchController.findById);
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(true), this.branchController.updatePublish);
    }
}

export default BranchRoute   