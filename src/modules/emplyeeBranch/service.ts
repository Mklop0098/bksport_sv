import errorMessages from "@core/config/constants";
import database from "@core/config/database";
import { HttpException } from "@core/exceptions";
import { IPagiantion } from "@core/interfaces";
import { checkExist } from "@core/utils/checkExist";
import _ from 'lodash';
import { RowDataPacket } from "mysql2";
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import axios from "axios";
import { CreateDto } from "./dtos/create.dto";
class EmployeeBranchService {

    private tableName = 'employee_branch'

    public create = async (model: CreateDto) => {
        try {
            const query = `INSERT INTO ${this.tableName} (seller_id, branch_id, user_id) VALUES (?, ?, ?)`
            const params = [model.seller_id, model.branch_id, model.user_id]
            
            const result = await database.executeQuery(query, params) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.CREATE_FAILED)
            }
            return result
        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED)
        }
    };
    public getByUserId = async (user_id: number, seller_id: number) => {
        try {
            const count = await database.executeQuery(`SELECT branch_id FROM ${this.tableName} WHERE user_id = ?`, [user_id]) as RowDataPacket
            if (count.length > 0 && count.map((item: any) => item.branch_id).includes(0)) {
                const query = `
                    SELECT 
                        b.id,
                        b.name
                    FROM branch b
                    WHERE seller_id = ?`
                const result = await database.executeQuery(query, [seller_id]) as RowDataPacket
                return {
                    data: result
                }
            }
            const query = `
                SELECT 
                    b.id,
                    b.name
                FROM ${this.tableName} eb
                LEFT JOIN branch b ON b.id = eb.branch_id
                WHERE eb.user_id = ?`
            const params = [user_id]
            
            const result = await database.executeQuery(query, params) as RowDataPacket
            if (result.length === 0) {
                return new HttpException(404, errorMessages.NOT_FOUND)
            }
            return {
                data: result
            }
        } catch (error) {
            return new HttpException(400, errorMessages.SEARCH_FAILED)
        }
    }
    
    public deleteRows = async (data: number[]) => {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id IN (${data})`
            const result = await database.executeQuery(query) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(404, errorMessages.NOT_FOUND)
            }
            return {
                data: {
                    message: errorMessages.DELETE_SUCCESS,
                    ids: data
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED)
        }
    }
}

export default EmployeeBranchService;
