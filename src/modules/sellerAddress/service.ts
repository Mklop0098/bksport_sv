import errorMessages from "@core/config/constants";
import database from "@core/config/database";
import { HttpException } from "@core/exceptions";
import { IPagiantion } from "@core/interfaces";
import { checkExist } from "@core/utils/checkExist";
import _ from 'lodash';
import mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2";
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import axios from "axios";
import { CreateDto } from "@modules/sellerAddress";
class SellerAddressService {

    private tableName = 'seller_address'

    public create = async (model: CreateDto) => {
        //console.log(model)
        if (model.seller_id) {
            try {
                const exist = await checkExist('seller', 'id', model.seller_id)
                if (exist === false) {
                    return new HttpException(400, errorMessages.SELLER_NOT_FOUND, 'seller_id')
                }
                const values = [
                    model.seller_id,
                    model.city_id || 0,
                    model.district_id || 0,
                    model.ward_id || 0,
                    !model.address ? null : `${model.address}`,
                    model.is_default || 0
                ]
                const query = `INSERT INTO ${this.tableName} (seller_id, city_id, district_id, ward_id, address, is_default) VALUES (?, ?, ?, ?, ?, ?)`
                const result = await database.executeQuery(query, values) as RowDataPacket
                //console.log(result)
                if (result.affectedRows === 0) {
                    return new HttpException(400, errorMessages.CREATE_FAILED)
                }
            } catch (error) {
                return new HttpException(400, errorMessages.CREATE_FAILED)
            }
        }
    };

    public update = async (model: CreateDto, id?: number) => {
        let values = []
        let query = `UPDATE ${this.tableName} SET `
        if (model.city_id != undefined) {
            query += `city_id = ?, `
            values.push(model.city_id)
        }
        if (model.district_id != undefined) {
            query += `district_id = ?, `
            values.push(model.district_id)
        }
        if (model.ward_id != undefined) {
            query += `ward_id = ?, `
            values.push(model.ward_id)
        }
        if (model.address != undefined) {
            query += `address = ?, `
            values.push(`${model.address}`)
        }
        const updated_at = new Date();
        query += `updated_at = ? WHERE seller_id = ? AND is_default = 1 `
        values.push(updated_at)
        values.push(model.seller_id)
        if (id != undefined) {
            query += ` AND id = ? `
            values.push(id)
        }
        //console.log(query, values)
        try {
            const result = await database.executeQuery(query, values);
            if ((result as mysql.ResultSetHeader).affectedRows == 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            return {
                data: {
                    id: id,
                    ...model,
                    updated_at: updated_at
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        }

    };

    public getAllSellerAdressBySellerId = async (id: number) => {
        const exist = await checkExist('seller', 'id', id)
        if (exist === false) {
            return new HttpException(400, errorMessages.SELLER_NOT_FOUND, 'id');
        }
        const query = `
            SELECT sa.id, c.name as city_name, d.name as district_name, w.name as ward_name, sa.address FROM seller_address sa
            LEFT JOIN city c ON sa.city_id = c.id
            LEFT JOIN district d ON sa.district_id = d.id
            LEFT JOIN ward w ON sa.ward_id = w.id
            WHERE sa.seller_id = ?
        `
        try {
            const result = await database.executeQuery(query, [id]) as RowDataPacket
            if (result.length < 1) {
                return new HttpException(400, errorMessages.SEARCH_FAILED);
            }
            return {
                data: result
            }
        } catch (error) {
            return new HttpException(400, errorMessages.SEARCH_FAILED);
        }
    }
}

export default SellerAddressService;
