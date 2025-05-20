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
class BankService {

    private tableName = 'bank'

    private createFolderIfNotExist = (dir: string) => {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
        fs.mkdirSync(dir, { recursive: true });
    }

    private downloadImage = async (url: string, folderName: string, fileName: string) => {      
        try {
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream',
            });
            if (response.status == 200) {
                const userDir = path.join(__dirname, process.env.BANK_UPLOAD_LOGO_PATH as string, folderName);
                this.createFolderIfNotExist(userDir);
                const filePath = path.join(userDir, `${fileName}.png`); 
    
                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);
    
                writer.on('error', (error) => {
                    console.error('Error writing file:', error);
                });
                return 'uploads' + process.env.BANK_UPLOAD_LOGO as string + '/' + folderName + '/' + `${fileName}.png`;
            }
        } catch (error) {
            console.error('Error downloading the image:', error);
            throw error;
        }
    };

    public create = async () => {
        const checkQuery = `SELECT id FROM ${this.tableName}`
        const bankList = await database.executeQuery(checkQuery) as RowDataPacket
        if (bankList.length < 1) {
            let value = []
            const data = await axios.get(process.env.BANK_URL as string) as RowDataPacket
            const arrayBank = Object.values(data.data) as RowDataPacket[]
            //console.log(arrayBank)
            if (arrayBank.length > 0) {
                for (const element of arrayBank) {
                    const logo = await this.downloadImage(element.bankLogoUrl, element.shortName, element.shortName)
                    value.push({name: element.name, bin: element.bin, shortName: element.shortName, logo})
                }
            }
            const values = value.map(bank => `("${bank.name}", "${bank.bin}", "${bank.shortName}", "${bank.logo}")`).join(', ');
            const query = `INSERT INTO ${this.tableName} (name, bin, shortName, logo) VALUE ${values}`
            const result = await database.executeQuery(query) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.CREATE_FAILED)
            }
        }
    };

    public getBankList = async () => {
        const query = `SELECT id, name, shortName, logo FROM ${this.tableName}`
        const result = await database.executeQuery(query) as RowDataPacket[]
        return {
            data: result
        }

    }
    
    public getBankById = async (id: number) => {
        const exist = await checkExist(this.tableName, 'id', id)
        if (exist === false) {
            return new HttpException(400, errorMessages.NOT_EXISTED, 'id')
        }
        return {
            data: exist
        }
    }
}

export default BankService;
