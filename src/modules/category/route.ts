import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { CategoryController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class CategoryRoute implements IRoute {
    public path = '/category';
    public router = Router();

    public categoryController = new CategoryController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/getDataForSelect', AuthMiddleware.authorization(), this.categoryController.getDataForSelect);
        this.router.get(this.path + '/get-root', this.categoryController.getRootCategories);
    }
}

export default CategoryRoute   