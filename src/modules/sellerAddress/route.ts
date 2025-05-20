import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { SellerAddressController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "@modules/sellerAddress";
export class SellerAddressRoute implements IRoute {
    public path = '/seller_address';
    public router = Router();

    public controller = new SellerAddressController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), this.controller.create);
        this.router.put(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.update);
        this.router.get(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.getAllSellerAdressBySellerId);
    }
}


export default SellerAddressRoute;