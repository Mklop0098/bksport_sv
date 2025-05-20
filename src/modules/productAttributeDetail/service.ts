import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar } from "@core/utils/gennerate.code";
import { convertStringToSlug } from "@core/utils/convertStringToSlug";

class ProductAttributeDetailService {

    private tableName = 'product_attribute_detail';

    public getAllProductAttributeDetail = async (id: number) => {
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
        if (model.values) {
            try {
                for (const item of model.values) {
                    const exist = await database.executeQuery(`
                        select id from ${this.tableName} where attribute_id = ? and value = ?
                    `, [model.attribute_id, item]) as RowDataPacket
                    if (exist.length === 0) {
                        const query = `
                            INSERT INTO ${this.tableName} (
                                attribute_id, value
                            ) VALUES (?, ?);
                        `;
                        const data = await database.executeQuery(query, [model.attribute_id, item]) as any
                        if (data.affectedRows > 0) {
                           //console.log(convertStringToSlug(item))
                            const e = await database.executeQuery(`
                                update product set 
                                name = CONCAT(name, '-${item}'), 
                                title = CONCAT(title, '-${item}'), 
                                slug = CONCAT(slug, '-${convertStringToSlug(item)}'),
                                attributes = CONCAT(attributes, '-${data.insertId}')  
                                where parent_id = ${model.parent_id}`)
                           //console.log(e)
                        }
                        else {
                            return new HttpException(400, errorMessages.CREATE_FAILED)
                        }
                    }
                }
                return model

            } catch (error) {
                return new HttpException(400, errorMessages.CREATE_FAILED)
            }
        }
        return new HttpException(400, errorMessages.CREATE_FAILED)
    }

    public delete = async (id: number) => {
        const exist = await database.executeQuery(`
                SELECT p.id, p.code, p.name, p.attributes, p.parent_id FROM product p
                WHERE p.parent_id = (
                SELECT DISTINCT pa.product_parent_id
                FROM product_attributes pa
                JOIN product_attribute_detail pad ON pad.attribute_id = pa.id
                WHERE pa.id = (SELECT attribute_id FROM product_attribute_detail WHERE id = ${id})
                );
            `) as RowDataPacket
        if (exist.length === 0) {
            return new HttpException(400, errorMessages.NOT_EXISTED, 'id')
        }
        const checkCanDelete = await database.executeQuery(
            `
                	SELECT id
                    FROM product
                    WHERE (attributes LIKE '${id}-%'   
                    OR attributes LIKE '%-${id}-%'
                    OR attributes LIKE '%-${id}'   
                    OR attributes = '${id}')       
                    AND parent_id = ${exist[0].parent_id}
                `
        ) as RowDataPacket
      
        if (checkCanDelete.length > 0) {
            const listId = checkCanDelete.map((item: any) => item.id)
            if (checkCanDelete.length === exist.length) {
                // xoa attribute trong product, sua lai ten
                const query = `
                    UPDATE product
                    SET attributes = TRIM(BOTH '-' FROM REPLACE(
                        CONCAT('-', attributes, '-'), 
                        '-${id}-', 
                        '-'
                    ))
                    WHERE FIND_IN_SET('${id}', REPLACE(attributes, '-', ',')) AND id IN (${listId});
                `
                for (const idx of listId) {
                    const index = await database.executeQuery(`
                            SELECT 
                                (LENGTH(SUBSTRING_INDEX(attributes, '${id}', 1)) - 
                                LENGTH(REPLACE(SUBSTRING_INDEX(attributes, '${id}', 1), '-', '')) + 1) AS attribute_index
                            FROM product
                            WHERE id =  ${idx};
                        `) as RowDataPacket
                    if (index.length > 0 && index[0].attribute_index > 0) {
                        const query = `
                            UPDATE product
                            SET 
                                name = TRIM(BOTH '-' FROM REPLACE(
                                    name,
                                    CONCAT(
                                        IF(${index[0].attribute_index + 1} = 1, '', '-'), 
                                        SUBSTRING_INDEX(SUBSTRING_INDEX(name, '-', ${index[0].attribute_index + 1}), '-', -1),
                                        IF(${index[0].attribute_index + 1} = 1, '-', '')  
                                    ), 
                                    ''
                                )),
                                title = TRIM(BOTH '-' FROM REPLACE(
                                    title,
                                    CONCAT(
                                        IF(${index[0].attribute_index + 1} = 1, '', '-'), 
                                        SUBSTRING_INDEX(SUBSTRING_INDEX(title, '-', ${index[0].attribute_index + 1}), '-', -1),
                                        IF(${index[0].attribute_index + 1} = 1, '-', '')  
                                    ), 
                                    ''
                                ))
                            WHERE attributes LIKE '%-%' and id = ${idx};
                        `
                        await database.executeQuery(query)
                    }
                }
                await database.executeQuery(query)
            }
            else {
                // xoa product co attribute tai index
                await database.executeQuery(`DELETE FROM product WHERE id IN (${listId})`)
            }
        }
        // xoa atrribute detail, neu attribute ko co detail => xoa attribute
       //console.log('a')
        const attribute = await database.executeQuery(`SELECT attribute_id FROM product_attribute_detail WHERE id = ${id}`) as RowDataPacket
        if (attribute.length > 0) {
            const checkAttDetail = await database.executeQuery(`SELECT id FROM product_attribute_detail WHERE attribute_id = ${attribute[0].attribute_id}`) as RowDataPacket
            checkAttDetail.length === 1 && await database.executeQuery(`DELETE FROM product_attributes WHERE id = ${attribute[0].attribute_id}`)
        }
        await database.executeQuery(`DELETE from product_attribute_detail WHERE id = ${id}`)
    }

    public deleteWithoutDeleteProduct = async (id: number) => {
        const attribute = await database.executeQuery(`SELECT attribute_id FROM product_attribute_detail WHERE id = ${id}`) as RowDataPacket
        if (attribute.length > 0) {
            const checkAttDetail = await database.executeQuery(`SELECT id FROM product_attribute_detail WHERE attribute_id = ${attribute[0].attribute_id}`) as RowDataPacket
            checkAttDetail.length === 1 && await database.executeQuery(`DELETE FROM product_attributes WHERE id = ${attribute[0].attribute_id}`)
        }
        await database.executeQuery(`DELETE from product_attribute_detail WHERE id = ${id}`)
    }

}

export default ProductAttributeDetailService