import { sendResponse } from "@core/utils";
import FollowerService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";
import TestService from "./service";

export class TestController {
    public service = new TestService();

    public TestAPI = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.id as any;
        try {
            const result = await this.service.TestAPI(id);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
  

}