import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { ProductAttributeDetailController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class ProductAttributeDetailRoute implements IRoute {
    public path = '/product-attribute-detail';
    public router = Router();

    public ProductAttributeDetailController = new ProductAttributeDetailController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/getAllProductAttributeDetail/:id', AuthMiddleware.authorization(true), this.ProductAttributeDetailController.getAllProductAttributeDetail);
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), errorMiddleware(CreateDto, "body", true), this.ProductAttributeDetailController.create);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.ProductAttributeDetailController.delete);

    }
}

export default ProductAttributeDetailRoute   