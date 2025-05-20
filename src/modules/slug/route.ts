import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { SlugController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class SlugRoute implements IRoute {
    public path = '/slug';
    public router = Router();

    public SlugController = new SlugController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorization(), this.SlugController.genSlug);
        // this.router.get(this.path + '/get-root', this.SlugController.getRootCategories);
    }
}

export default SlugRoute   