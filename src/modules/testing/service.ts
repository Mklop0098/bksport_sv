import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar } from "@core/utils/gennerate.code";
import ProductService from "@modules/product/product.service";

// import request from 'supertest';
// import axios from 'axios';
// import { describe, it } from "node:test";
// const expect = require("chai").expect;
class TestService {
    private productService = new ProductService();
    public TestAPI = async (seller_id: string) => {
        // try {
        //     describe('E2E Test: Product API', () => {
        //         it('should return product list', async () => {
        //             const response = await axios.get('http://localhost:3001/api/v1/test');
        //             expect(response.status).to.equal(200);
        //             expect(response.data).to.be.an('array');
        //         });
        //     });
        // } catch (error) {
        //     throw error;
        // }
    }
}

export default TestService