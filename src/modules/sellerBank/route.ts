import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { SellerBankController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "@modules/sellerBank";
class SellerBankRoute implements IRoute {
    public path = '/seller_bank';
    public router = Router();

    public controller = new SellerBankController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorization(true),  errorMiddleware(CreateDto, 'body', false), this.controller.create);
        this.router.put(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.update);
        this.router.get(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.getAllSellerBankBySellerId);
        
    }
}


export default SellerBankRoute;