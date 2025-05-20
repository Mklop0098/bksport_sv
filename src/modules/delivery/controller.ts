import { sendResponse } from "@core/utils";
import DeliveryService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";
import { ISearch } from "./interface";
import errorMessages from "@core/config/constants";

export class DeliveryController {
    public service = new DeliveryService();    
}