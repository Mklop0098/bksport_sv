import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '@core/utils';

namespace UserMiddleware {
    export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
        if (Array.isArray(req.file) && req.file.length != 1)
            return sendResponse(res, 400, 'only upload one file')
        next();
    }
}
export default UserMiddleware;