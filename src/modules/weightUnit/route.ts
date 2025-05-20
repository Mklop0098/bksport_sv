import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { WeightUnitController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class WeightUnitRoute implements IRoute {
    public path = '/weight-unit';
    public router = Router();

    public WeightUnitController = new WeightUnitController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/', this.WeightUnitController.getAllWeightUnit);
    }
}

export default WeightUnitRoute   