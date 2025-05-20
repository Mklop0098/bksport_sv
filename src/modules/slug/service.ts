import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar, generateNumberRandom } from "@core/utils/gennerate.code";
import { convertStringToSlug } from "@core/utils/convertStringToSlug";

class SlugService {

    private tableName = 'slug';

    public genSlug = async (name: string) => {
        let slug = convertStringToSlug(name)
        const exist = await checkExist(this.tableName, 'slug', slug)
        const code = await generateNumberRandom(6)
        if (exist !== false) {
            slug = slug + "-" + code
        }
        return {
            data: slug
        }
    }

    public create = async (type: string, slug: string) => {
        try {
            const date = new Date()
            const exist = await database.executeQuery(`select id from ${this.tableName} where type = ? and slug = ?`, [type, slug]) as RowDataPacket
            if (exist.length < 1) {
                const query = `INSERT INTO slug (type, slug, created_at, updated_at) VALUES (?, ?, ?, ?)`
                const result = await database.executeQuery(query, [type, slug, date, date]) as RowDataPacket
                if (result.affectedRows === 0) {
                    return new HttpException(400, errorMessages.CREATE_FAILED)
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED)
        }
    }

    public update = async (type: string, slug: string, oldSlug: string) => {
        console.log(type, slug, oldSlug)
        try {
            const date = new Date()
            const exist = await database.executeQuery(`select id from ${this.tableName} where type = ? and slug = ?`, [type, oldSlug]) as RowDataPacket
            console.log(exist)
            if (exist.length < 1) {
                const res = await this.create(type, slug)
                console.log(res)
            }
            else {
                const result = await database.executeQuery(`update slug set slug = ? where type = ? and slug = ?`, [slug, type, oldSlug]) as RowDataPacket
                if (result.affectedRows === 0) {
                    return new HttpException(400, errorMessages.UPDATE_FAILED)
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }

    public delete = async (type: string, slug: string) => {
        try {
            const date = new Date()
            const result = await database.executeQuery(`delete from slug where type = ? and slug = ?`, [type, slug]) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.DELETE_FAILED)
            }
        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED)
        }
    }

    public checkSlug = async (type: string, slug: string) => {
        const result = await database.executeQuery(`select id from slug where type = ? and slug = ?`, [type, slug]) as RowDataPacket
        if (result.length > 0) {
            return new HttpException(400, errorMessages.EXISTED)
        }
    }
}

export default SlugService