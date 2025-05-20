import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { ProductAttributesController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class ProductAttributesRoute implements IRoute {
    public path = '/product-attributes';
    public router = Router();

    public ProductAttributesController = new ProductAttributesController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/getAllProductAttributes/:id', AuthMiddleware.authorization(true), this.ProductAttributesController.getAllProductAttributes);
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), errorMiddleware(CreateDto, "body", true), this.ProductAttributesController.create);
    }
}

export default ProductAttributesRoute   