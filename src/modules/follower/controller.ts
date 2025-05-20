import { sendResponse } from "@core/utils";
import FollowerService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class FollowerController {
    public service = new FollowerService();

    public getAllFollower = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.service.getAllFollower(id);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}