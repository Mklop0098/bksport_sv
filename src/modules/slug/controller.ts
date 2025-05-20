import { sendResponse } from "@core/utils";
import SlugService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class SlugController {
    public service = new SlugService();

    public genSlug = async (req: Request, res: Response, next: NextFunction) => {
        const {name} = req.body as any
        try {
            const result = await this.service.genSlug(name);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}