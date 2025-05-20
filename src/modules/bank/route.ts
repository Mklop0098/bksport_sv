import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { BankController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
class BankRoute implements IRoute {
    public path = '/bank';
    public router = Router();

    public controller = new BankController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/', this.controller.create);
        this.router.get(this.path + '/bank-list', this.controller.getBankList);
        this.router.get(this.path + '/bank/:id', this.controller.getBankById);
    }
}


export default BankRoute;