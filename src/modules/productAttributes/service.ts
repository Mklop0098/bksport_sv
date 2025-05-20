import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import ProductAttributeDetailService from "@modules/productAttributeDetail/service";
import {CreateDto as AttributeDetailDto} from '@modules/productAttributeDetail/dtos/create.dto'
class ProductAttributesService {

    private tableName = 'product_attributes';
    private productAttributeDetailService = new ProductAttributeDetailService()

    public getAllProductAttributes = async (id: number) => {
        try {
            const unFollowQuery = `
                SELECT f.user_id, u.name FROM ${this.tableName} f
                LEFT JOIN users u ON f.user_id = u.id
                WHERE f.seller_id = ?
            `
            const result = await database.executeQuery(unFollowQuery, [id]) as RowDataPacket
            return {
                data: result
            }

        } catch (error) {
            return new HttpException(400, errorMessages.FOLLOW_ERROR)
        }
    }

    public create = async (model: CreateDto) => {
        try {
            const exist = await database.executeQuery(`SELECT id from ${this.tableName} where name = ? and product_parent_id = ?`, [model.name, model.product_parent_id]) as RowDataPacket
            if (exist.length > 0) {
                return new HttpException(400, 'Thuộc tính đã tồn tại')
            }
            const query = `
                INSERT INTO ${this.tableName} (name, product_parent_id) VALUES (?, ?)
            `
            const result = await database.executeQuery(query, [model.name, model.product_parent_id]) as any
            if (result.affectedRows !== 0) {
                const detailModel:AttributeDetailDto = {
                    attribute_id: result.insertId,
                    values: model.values,
                    parent_id: model.product_parent_id
                } 
                const data = await this.productAttributeDetailService.create(detailModel)
               //console.log(data, result)
            }



            return {
                data: result
            }

        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED)
        }
    }

    public createNewAttributes = async (id: number, attributes: {name: string, values: any, product_attributes_id?: number}[]) => {
        try {
            for (const element of attributes) {
                if (element.product_attributes_id) {
                    await this.updateAttribute(element.product_attributes_id, element.name)
                }
                else {
                    const model: CreateDto = {
                        name: element.name,
                        product_parent_id: id,
                        values: element.values
                    }
                    const result = await this.create(model)
                    if (result instanceof HttpException) {
                        return new HttpException(400, errorMessages.CREATE_FAILED, element.name);
                    }
                }
            }
            return {
                data: attributes
            }
        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED)
        }
    }

    public updateAttribute = async (id : number, name: string) => {
        try {
            const update = await database.executeQuery(`update ${this.tableName} set name = "${name}" where id = ${id}`) as RowDataPacket
            if (update.affectedRows === 0) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }

    public deleteAttribute = async (id: number) => {
        const exist = await checkExist(this.tableName, 'id', id)
        if (exist === false) {
            return new HttpException(400, errorMessages.NOT_EXISTED, 'attribute_id')
        }
        const listDetailId = await database.executeQuery(`
            select pad.id from product_attribute_detail pad 
            left join product_attributes pa on pa.id = pad.attribute_id
            where pa.id = ${id}  
        `) as RowDataPacket
        if (listDetailId.length > 0) {
            for (const element of listDetailId.map((item: any) => item.id)) {
                const result = await this.productAttributeDetailService.delete(element)
                if (result instanceof HttpException) {
                    return new HttpException(400, errorMessages.DELETE_FAILED, element);
                }
            }
        }
        else {
            const deleteAtt = await database.executeQuery(`
                delete from ${this.tableName} 
                where id = ${id}  
            `) as RowDataPacket
            if (deleteAtt.affectedRows === 0 ) {
                return new HttpException(400, errorMessages.DELETE_FAILED)
            }
        }
    }
}

export default ProductAttributesService