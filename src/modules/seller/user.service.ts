import { HttpException } from "@core/exceptions";
import bcryptjs, { compareSync } from 'bcryptjs';
import database from "@core/config/database";
import { RowDataPacket } from "mysql2/promise";
import mysql from "mysql2/promise";
import { Create } from "./dtos/create.dto";
import { IPagiantion } from "@core/interfaces";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import { v4 as uuidv4 } from 'uuid';
import BranchService from "@modules/branch/service";
import { CreateDto as BranchModel } from "@modules/branch/dtos/create.dto";
import UserServices from "@modules/users/user.service";
import { Create as UserModel } from "@modules/users/dtos/create.dto";
import { generateCode } from "@core/utils/gennerate.code";
import { CreateDto as SellerAddressDto } from '@modules/sellerAddress'
import { CreateDto as SellerBankDto } from '@modules/sellerBank'
import SellerAddressService from "@modules/sellerAddress/service";
import SellerBankService from "@modules/sellerBank/service";
import SellerCategoryService from "@modules/sellerCategory/service";
import { createFolder } from "./helper";
import UserRoleService from "@modules/userRole/service";
import { IReportStatus } from "@modules/purchaseOrder/interface";
import { UpdateShopInfoDto } from "./dtos/updateShopInfo.dto";
import EmployeeBranchService from "@modules/emplyeeBranch/service";
class SellerService {
    private tableName = 'seller';
    private branchService = new BranchService()
    private userService = new UserServices()
    private sellerAddressService = new SellerAddressService()
    private sellerBankService = new SellerBankService()
    private sellerCategoryService = new SellerCategoryService()
    private employeeBranch = new EmployeeBranchService()

    public updateActive = async (id: number) => {
        try {
            let result = null;
            let active = 0
            const update_at = new Date()
            const getactive = await database.executeQuery(`select active from ${this.tableName} where id = ?`, [id]);
            if ((getactive as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND);
            if ((getactive as RowDataPacket[])[0].active == 0) {
                active = 1
                result = await database.executeQuery(`update ${this.tableName} set active = ?, updated_at = ? where id = ?`, [active, update_at, id]);
            }
            if ((getactive as RowDataPacket[])[0].active == 1) {
                result = await database.executeQuery(`update ${this.tableName} set active = ?, updated_at = ? where id = ?`, [active, update_at, id]);
            }
            return {
                data: {
                    id: id,
                    active: active,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    private generateURLByName = async (text: string) => {
        let check;
        let url = text
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "")
            .replace(/-+/g, "")
            .replace(/^-+|-+$/g, "");
        do {
            if (check) {
                url = url + Math.floor(Math.random() * 1000);
            }
            check = await checkExist(this.tableName, "url", url);
        } while (check && (check as any as RowDataPacket[]).length > 0);
        return url;
    }

    public checkExistInfomation = async (field: string, values: any) => {
        const checkSeller = await checkExist(this.tableName, field, values);
        if (checkSeller) return new HttpException(400, errorMessages.EXISTED.toLocaleLowerCase(), field);
        if (field !== 'name') {
            const checkUser = await checkExist('users', field, values);
            if (checkUser) return new HttpException(400, errorMessages.EXISTED.toLocaleLowerCase(), field);
        }
        if (field === 'phone') {
            const phoneRegex = /^(0|\+84)[0-9]{9}$/;
            if (!phoneRegex.test(values)) {
                return new HttpException(400, 'Số điện thoại không đúng định dạng', field);
            }
        }
        if (field === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(values)) {
                return new HttpException(400, 'Email không đúng định dạng', field);
            }
        }
    }

    public create = async (model: Create, role_id: number, avatar: any, background: any, certificate_image: any, identity_front_img: any, identity_back_img: any) => {
        //console.log(model)
        if (model.business_type_id === undefined) {
            return new HttpException(400, errorMessages.MISSING_BUSINESS_TYPE_ID, 'business_type_id');
        }
        let code = await generateCode('seller', 8) as string;
        let url = "";
        const checkPhone = await checkExist('users', 'phone', model.phone);
        if (checkPhone)
            return new HttpException(400, errorMessages.PHONE_EXISTED, 'phone');
        const checkEmail = await checkExist('users', 'email', model.email);
        if (checkEmail)
            return new HttpException(400, errorMessages.EMAIL_EXISTED, 'email');
        if (model.name != undefined) {
            const checkName = await checkExist(this.tableName, 'name', model.name);
            if (checkName)
                return new HttpException(400, errorMessages.NAME_EXISTED, 'name');
            url = await this.generateURLByName(model.name);
        }

        const { pathAvatar, pathBackground, pathCertificate, pathIdentityFrontImg, pathIdentityBackImg } = await createFolder(avatar, background, certificate_image, identity_front_img, identity_back_img, code)
        try {
            const uuid = uuidv4();
            const pwRandom = uuid.slice(0, 8);
            const hashedPassword = await bcryptjs.hash(model.password || '', 10);
            const created_at = new Date()
            const updated_at = new Date()
            let query = `INSERT INTO ${this.tableName} ( code, name, email, phone, url, active, business_type_id, created_id, created_at, updated_at, description, avatar, background, certificate_code, certificate_image, business_owner, identity_type, identity_code, identity_front_img, identity_back_img, personal_PIT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                code,
                model.name,
                model.email,
                model.phone,
                url,
                role_id === 1 ? 1 : 0,
                model.business_type_id || 0,
                model.created_id || 0,
                created_at,
                updated_at,
                model.description || null,
                avatar ? pathAvatar : null,
                background ? pathBackground : null,
                model.certificate_code || null,
                certificate_image ? pathCertificate : null,
                model.business_owner || null,
                model.identity_type || 0,
                model.identity_code || null,
                identity_front_img ? pathIdentityFrontImg : null,
                identity_back_img ? pathIdentityBackImg : null,
                model.personal_PIT || null
            ]
            const result = await database.executeQuery(query, values);
            let id = (result as mysql.ResultSetHeader).insertId;
            // create user
            const modelUser: UserModel = {
                password: hashedPassword,
                text_password: model.password,
                name: model.shop_owner,
                email: model.email,
                phone: model.phone,
                active: 0,
                role_id: 3,
                seller_id: id,
                created_id: model.created_id,
            }
            const user = await this.userService.createUser(modelUser, undefined) as any;
            // create branch
            const branch: BranchModel = {
                name: 'Chi nhánh mặc định',
                seller_id: id,
                is_default: 1,
                publish: 1,
                created_id: user.data.id,
                warehouse_type: model.warehouse_type,
                city_id: model.warehouse_city_id,
                district_id: model.warehouse_district_id,
                ward_id: model.warehouse_ward_id,
                address: model.warehouse_address,
                longitude: model.longitude,
                latitude: model.latitude
            }
            await this.branchService.create(branch);

            // create seller address
            const sellerAddress: SellerAddressDto = {
                seller_id: id,
                city_id: model.is_warehouse_address ? model.warehouse_city_id : model.seller_city_id,
                district_id: model.is_warehouse_address ? model.warehouse_district_id : model.seller_district_id,
                ward_id: model.is_warehouse_address ? model.warehouse_ward_id : model.seller_ward_id,
                address: model.is_warehouse_address ? model.warehouse_address : model.seller_address,
                is_default: 1
            }
            await this.sellerAddressService.create(sellerAddress)

            // create seller bank
            const sellerBank: SellerBankDto = {
                seller_id: id,
                city_id: model.bank_city_id,
                bank_id: model.bank_id,
                account_name: model.account_name,
                account_number: model.account_number,
                bank_branch: model.bank_branch,
                is_default: 1
            }
            await this.sellerBankService.create(sellerBank)

            // create seller category
            await this.sellerCategoryService.create(id, model.category_id || [])
            const employeeBranch = {
                seller_id: id,
                branch_id: 0,
                user_id: user.data.id
            }
            await this.employeeBranch.create(employeeBranch)

            delete (model as RowDataPacket).password;
            return {
                data: {
                    id: id,
                    ...model,
                    created_at: created_at,
                    updated_at: updated_at,
                    join_year: created_at.getFullYear()
                }
            }
        } catch (error) {
            return new HttpException(500, errorMessages.CREATE_FAILED);
        }
    }
    public delete = async (id: number) => {
        const checkId = await checkExist(this.tableName, 'id', id.toString());
        if (!checkId)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        let phone = (checkId as RowDataPacket[])[0].phone;
        const result = await database.executeQuery(`delete from ${this.tableName} where id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            data: {
                message: errorMessages.DELETE_SUCCESS,
                id: id
            }
        }
    }

    public getOne = async (id: number) => {
        const result = await checkExist(this.tableName, 'id', id.toString());
        if (result == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        delete (result as RowDataPacket[])[0].password;
        delete (result as RowDataPacket[])[0].token;

        return {
            data: {
                ...(result as RowDataPacket[])[0]
            }
        };
    }

    public searchs = async (key: string, name: string, phone: string, email: string, pageInt: number, limitInt: number, active: number, business_type_id: number, seller_id: number) => {
        let query = `SELECT seller.* , business_type.name AS business_type_name
                    FROM ${this.tableName} 
                    LEFT JOIN business_type ON seller.business_type_id = business_type.id 
                    WHERE 1 = 1 `;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;

        if (key && key.length != 0) {
            query += ` and (seller.name like '%${key}%' or seller.phone like '%${key}%' or seller.email like '%${key}%' or seller.code like '%${key}%')`
            countQuery += ` and (name like '%${key}%' or phone like '%${key}%' or email like '%${key}%' or code like '%${key}%')`
        }
        if (active && active.toString().length > 0) {
            query += ` and seller.active = ${active}`
            countQuery += ` and active = ${active}`
        }
        if (business_type_id && business_type_id.toString().length > 0) {
            query += ` and seller.business_type_id = ${business_type_id}`
            countQuery += ` and business_type_id = ${business_type_id}`
        }
        query += ` order by seller.id desc`

        const resultNotPagination = await database.executeQuery(query) as RowDataPacket;
        if (resultNotPagination.length === 0) { }
        const listStatus = [
            { business_type_id: 1, total: 0 },
            { business_type_id: 2, total: 0 },
            { business_type_id: 3, total: 0 },
            { business_type_id: 4, total: 0 }
        ]
        if (pageInt && pageInt < 1 || pageInt && limitInt < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (pageInt && limitInt) {
            query = query + ` LIMIT ` + limitInt + ` OFFSET ` + (pageInt - 1) * limitInt;
        }

        let pagination: IPagiantion = {
            page: pageInt,
            limit: limitInt,
            totalPage: 0
        }
        const count = await database.executeQuery(countQuery);
        const totalPages = Math.ceil((count as RowDataPacket[])[0].total / limitInt);
        if (Array.isArray(count) && count.length > 0)
            pagination.totalPage = totalPages

        const result = await database.executeQuery(query);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.FIND_ALL_FAILED);
        await Promise.all((result as RowDataPacket[]).map(async (row: any) => {
            delete row.password;
            delete row.token;
        }));

        const resultMap = new Map();
        for (const item of resultNotPagination as any) {
            const status = item.business_type_id
            if (resultMap.has(status)) {
                resultMap.get(status).push(item);
            } else {
                resultMap.set(status, [item]);
            }
        }
        const statusMap = new Map()
        for (const item of listStatus) {
            statusMap.set(item.business_type_id, item);
        }
        for (const [status, items] of resultMap) {
            const statusItem = statusMap.get(status);
            if (statusItem) {
                statusItem.total += items.length
            }
        }

        return {
            data: result,
            pagination: pagination,
            listStatisticSeller: listStatus
        }
    }
    public statistics = async () => {
        let countQuery = `SELECT 
            COUNT(CASE WHEN active = 1 THEN 1 END) AS totalactive,
            COUNT(CASE WHEN active = 0 THEN 1 END) AS totalUnactive,
            COUNT(*) AS total
        FROM ${this.tableName};`;
        const result = await database.executeQuery(countQuery);
        return {
            data: (result as RowDataPacket[])[0]
        }
    }
    public deleteRows = async (data: number[]) => {
        let query = `delete from ${this.tableName} where id in (${data})`
        const result = await database.executeQuery(query);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS
        }
    }
    public updateListActive = async (data: number[], active: number) => {
        try {
            let result = null;
            const update_at = new Date()
            let query = `update ${this.tableName} set active = ?, updated_at = ? where id in (${data})`
            result = await database.executeQuery(query, [active, update_at]);
            return {
                data: {
                    active: active,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public updateProfile = async (model: Create, id: number, avatar: any, background: any, certificate_image: any, identity_front_img: any, identity_back_img: any, user_id: number) => {
        let url = '';
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        const code = check[0].code
        const { pathAvatar, pathBackground, pathCertificate, pathIdentityFrontImg, pathIdentityBackImg } = await createFolder(avatar, background, certificate_image, identity_front_img, identity_back_img, code)
        
        if (model.shop_owner != undefined) {
            await database.executeQuery(`update users set name = ? where id = ?`, [model.shop_owner, user_id]);
        }
        
        let query = `UPDATE ${this.tableName} SET `;
        let values = [];
        if (model.email != undefined) {
            query += `email = ?,`
            values.push(model.email)
        }
        if (model.name != undefined) {
            const checkName = await checkExist(this.tableName, 'name', model.name, id);
            if (checkName) {
                return new HttpException(400, errorMessages.NAME_EXISTED, 'name');
            }
            url = await this.generateURLByName(model.name);
            query += `name = ?,`
            values.push(model.name)
            query += `url = ?,`
            values.push(url)
        }
        if (model.phone != undefined) {
            const checkPhoneUnique = await checkExist(this.tableName, 'phone', model.phone, id);
            if (checkPhoneUnique) {
                return new HttpException(400, errorMessages.PHONE_EXISTED, 'phone');
            }
            query += `phone = ?,`
            values.push(model.phone);
        }
        if (model.description != undefined) {
            query += `description = ?,`
            values.push(model.description)
        }
        if (model.active && model.active.toString().length > 0) {
            query += `active = ?,`
            values.push(model.active)
        }
        if (model.certificate_code != undefined) {
            query += `certificate_code = ?,`
            values.push(model.certificate_code)
        }
        if (model.business_owner != undefined) {
            query += `business_owner = ?,`
            values.push(model.business_owner)
        }
        if (model.identity_type != undefined) {
            query += `identity_type = ?,`
            values.push(model.identity_type)
        }
        if (model.identity_code != undefined) {
            query += `identity_code = ?,`
            values.push(model.identity_code)
        }
        if (avatar != undefined) {
            query += `avatar = ?,`
            values.push(pathAvatar)
        }
        if (background != undefined) {
            query += `background = ?,`
            values.push(pathBackground)
        }
        if (certificate_image != undefined) {
            query += `certificate_image = ?,`
            values.push(pathCertificate)
        }
        if (identity_front_img != undefined) {
            query += `identity_front_img = ?,`
            values.push(pathIdentityFrontImg)
        }
        if (identity_back_img != undefined) {
            query += `identity_back_img = ?,`
            values.push(pathIdentityBackImg)
        }
        if (model.personal_PIT != undefined) {
            query += `personal_PIT = ?,`
            values.push(model.personal_PIT)
        }
        if (model.business_type_id != undefined) {
            query += `business_type_id = ?,`
            values.push(model.business_type_id)
        }

        const updated_at = new Date();
        query += `updated_at = ? WHERE id = ?`
        values.push(updated_at)
        values.push(id)

        try {
            const result = await database.executeQuery(query, values);
            if ((result as mysql.ResultSetHeader).affectedRows == 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);

            // update seller category 
            await this.sellerCategoryService.update(id, model.category_id || [])

            // update seller bank
            const sellerBank: SellerBankDto = {
                seller_id: id,
                city_id: model.bank_city_id,
                bank_id: model.bank_id,
                account_name: model.account_name,
                account_number: model.account_number,
                bank_branch: model.bank_branch
            }
            await this.sellerBankService.update(sellerBank)

            // update seller address
            //console.log(model.is_warehouse_address, !!Number(model.is_warehouse_address), typeof model.is_warehouse_address)
            const sellerAddress: SellerAddressDto = {
                seller_id: id,
                city_id: !!Number(model.is_warehouse_address) ? model.warehouse_city_id : model.seller_city_id,
                district_id: !!Number(model.is_warehouse_address) ? model.warehouse_district_id : model.seller_district_id,
                ward_id: !!Number(model.is_warehouse_address) ? model.warehouse_ward_id : model.seller_ward_id,
                address: !!Number(model.is_warehouse_address) ? model.warehouse_address : model.seller_address,
            }
            //console.log("sellerAddress",  sellerAddress)
            await this.sellerAddressService.update(sellerAddress)

            return {
                data: {
                    id: id,
                    ...model,
                    updated_at: updated_at
                }
            }
        } catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }

    }
    public getProfileById = async (id: number) => {
        const result = await checkExist(this.tableName, 'id', id.toString());
        if (result == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        delete (result as RowDataPacket[])[0].password;
        delete result[0].token;
    }
    public saveDeviceToken = async (id: number, token: string) => {
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check === false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        const checkToken = await checkExist('device_token', 'user_id', id.toString());
        if (Array.isArray(checkToken) && checkToken.length > 0 && id == (checkToken as RowDataPacket[])[0].user_id) {
            let queryUpdate = `update device_token set token = ?, updated_at = ? where user_id = ?`
            const resultUpdate = await database.executeQuery(queryUpdate, [token, new Date(), id]);
            if ((resultUpdate as mysql.ResultSetHeader).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
        } else {
            let query = "insert into device_token (token, user_id) values (?, ?)"
            const result = await database.executeQuery(query, [token, id]);
            if ((result as mysql.ResultSetHeader).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
        }
        return {
            data: {
                id: id,
                token: token
            }
        }
    }

    public getSellerById = async (id: number) => {
        const exist = await checkExist(this.tableName, 'id', id)
        if (exist === false) {
            return new HttpException(400, errorMessages.SELLER_NOT_FOUND);
        }
        try {

            const getQuery = `
                SELECT 
                GROUP_CONCAT(
                    DISTINCT JSON_OBJECT(
                        'city_id', sa.city_id,
                        'district_id', sa.district_id,
                        'ward_id', sa.ward_id,
                        'address', sa.address
                    )
                ) AS seller_address,
                GROUP_CONCAT(
                    DISTINCT JSON_OBJECT(
                        'bank_id', b.id,
                        'account_name', sb.account_name,
                        'account_number', sb.account_number,
                        'bank_city_id', c.id,
                        'bank_branch', sb.bank_branch
                    )
                ) AS seller_bank,
                GROUP_CONCAT(
                    DISTINCT JSON_OBJECT(
                        'category_id', sc.category_id
                    )
                ) AS seller_category,
                s.name AS seller_name, s.code, s.email, s.phone, s.url, s.active, s.business_type_id, s.avatar, s.background, s.description, s.certificate_code, s.certificate_image, s.business_owner, s.identity_type, s.identity_code, s.identity_front_img, s.identity_back_img, s.personal_PIT, u.name AS shop_owner
                FROM seller s
                LEFT JOIN seller_address sa ON sa.seller_id = s.id
                LEFT JOIN seller_bank sb ON sb.seller_id = s.id
                LEFT JOIN city c ON sb.city_id = c.id
                LEFT JOIN bank b ON sb.bank_id = b.id
                LEFT JOIN seller_category sc ON sc.seller_id = s.id
                LEFT JOIN users u ON s.id = u.seller_id

                WHERE s.id = ?
            `
            const seller = await database.executeQuery(getQuery, [id]) as RowDataPacket[]
            //console.log(seller[0].seller_address)
            return {
                data: {
                    ...seller[0],
                    seller_address: JSON.parse("[" + seller[0].seller_address + "]"),
                    seller_bank: JSON.parse("[" + seller[0].seller_bank + "]"),
                    seller_category: JSON.parse("[" + seller[0].seller_category + "]").map((item: any) => item.category_id),
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.SEARCH_FAILED);
        }
    }

    public getSellerDetailById = async (id: number) => {
        const exist = await checkExist(this.tableName, 'id', id)
        if (exist === false) {
            return new HttpException(400, errorMessages.SELLER_NOT_FOUND);
        }
        try {
            const getQuery = `
                SELECT 
                GROUP_CONCAT(
                    DISTINCT JSON_OBJECT(
                        'city_name', c.name,
                        'district_name', d.name,
                        'ward_name', w.name,
                        'address', sa.address
                    )
                ) AS seller_address,
                GROUP_CONCAT(
                    DISTINCT JSON_OBJECT(
                        'bank_name', b.name,
                        'bank_shortName', b.shortName,
                        'logo', b.logo,
                        'account_name', sb.account_name,
                        'account_number', sb.account_number,
                        'bank_city_name', c.name,
                        'bank_branch', sb.bank_branch
                    )
                ) AS seller_bank,
                GROUP_CONCAT(
                    DISTINCT JSON_OBJECT(
                        'category_id', sc.category_id,
                        'name', cate.name
                    )
                ) AS seller_category,
                GROUP_CONCAT(
                    DISTINCT JSON_OBJECT(
                        'identity_front_img', s.identity_front_img,
                        'identity_back_img', s.identity_back_img
                    )
                ) AS identity_image,
                s.name AS seller_name, s.code, s.email, s.phone, s.url, s.active, bt.name as business_type_name, s.avatar, s.background, s.description, 
                s.certificate_code, s.certificate_image, s.business_owner, s.identity_type, s.identity_code, 
                s.personal_PIT,
                u.name AS shop_owner
                FROM seller s
                LEFT JOIN seller_address sa ON sa.seller_id = s.id
                LEFT JOIN seller_bank sb ON sb.seller_id = s.id
                LEFT JOIN city c ON sb.city_id = c.id
                LEFT JOIN district d ON sa.district_id = d.id
                LEFT JOIN ward w ON sa.ward_id = w.id
                LEFT JOIN bank b ON sb.bank_id = b.id
                LEFT JOIN seller_category sc ON sc.seller_id = s.id
                LEFT JOIN users u ON s.id = u.seller_id
                LEFT JOIN product_category cate ON sc.category_id = cate.id
                LEFT JOIN business_type bt ON s.business_type_id = bt.id

                WHERE s.id = ?;
            `
            const seller = await database.executeQuery(getQuery, [id]) as RowDataPacket[]
            return {
                data: {
                    ...seller[0],
                    seller_address: JSON.parse("[" + seller[0].seller_address + "]"),
                    seller_bank: JSON.parse("[" + seller[0].seller_bank + "]"),
                    seller_category: JSON.parse("[" + seller[0].seller_category + "]"),
                    identity_image: JSON.parse("[" + seller[0].identity_image + "]")[0],
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.SEARCH_FAILED);
        }
    }

    public updateShopInfo = async (model: UpdateShopInfoDto, id: number) => {
        const exist = await checkExist(this.tableName, 'id', id)
        if (!exist) {
            return new HttpException(404, errorMessages.NOT_EXISTED, 'id')
        }
        try {
            const updateSelelr = await database.executeQuery(`
                UPDATE ${this.tableName} SET name = '${model.name}', phone = '${model.phone}', email = '${model.email}' WHERE id = ${id}
            `)
            const updateAddress = await database.executeQuery(`
                UPDATE seller_address set city_id = ?, district_id = ?, ward_id = ?, address = '${model.address}' WHERE id = ${id}   
            `, [model.city_id, model.district_id, model.ward_id])
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }
}

export default SellerService;
