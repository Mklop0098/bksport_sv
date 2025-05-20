import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { TestController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class TestRoute implements IRoute {
    public path = '/test';
    public router = Router();

    public TestController = new TestController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/', AuthMiddleware.authorization(), this.TestController.TestAPI);
    }
}

export default TestRoute   