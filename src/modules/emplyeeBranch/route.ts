import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { EmployeeBranchController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
class EmployeeBranchRoute implements IRoute {
    public path = '/employee-branch';
    public router = Router();

    public controller = new EmployeeBranchController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/', this.controller.create);
        this.router.get(this.path + '/user-branch', AuthMiddleware.authorization(), this.controller.getByUserId);
    }
}


export default EmployeeBranchRoute;