import { HttpException } from "@core/exceptions";
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import axios from "axios";
import errorMessages from "@core/config/constants";

export namespace UploadImage {
    // export const createFolderIfNotExist = (dir: string) => {
    //     if (!fs.existsSync(dir)) {
    //         fs.mkdirSync(dir, { recursive: true });
    //     }
    // }
    // export const uploadImage = async (code: string, file: Express.Multer.File, UPLOAD_IMAGE_PATH: string) => {
    //     const allowedFile = ['.png', '.jpg', '.jpeg']
    //     if (!allowedFile.includes(path.extname(file.originalname)))
    //         return new HttpException(400, 'invalid file type')
    //     const userDir = path.join(__dirname, process.env.UPLOAD_IMAGE_PATH as string, code);

    //     createFolderIfNotExist(userDir)
    //     const fileExtension = path.extname(file.originalname);
    //     const uploadPath = path.join(userDir, `${code}${fileExtension}`)
    //     const upload = await sharp(file.buffer).toFile(uploadPath)

    //     const files = fs.readdirSync(userDir);
    //     for (const fileName of files) {
    //         fs.unlinkSync(path.join(userDir, fileName));
    //     }

    //     if (upload) {
    //         await sharp(file.buffer).toFile(uploadPath);
    //         const relativePath = path.relative(
    //             path.join(__dirname, process.env.UPLOAD_IMAGE_PATH as string, '..'),
    //             uploadPath
    //         );
    //         return relativePath
    //     }
    //     return new HttpException(400, 'upload failed')
    // }

    const files: Blob[] = []

    export const upload = async(upload_type: string, module_code: string, name: string, module_id: string) => {
        const formData = new FormData();
        console.log(files)
        files.forEach(file => {
            formData.append('files', file);
        })
        formData.append('type', upload_type);
        formData.append('module_code', module_code);
        formData.append('name', name);
        formData.append('module_id', module_id);
        formData.append('module_type', 'product-category');
        formData.append('width', '350');
        formData.append('height', '350');
        const response = await axios.post('http://192.168.102.15:3006/api/v1/files', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        console.log(response.data)
        return response.data

    }
    export const createFolderIfNotExist = (dir: string) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    export const deleteFileIfExist = (filePath: string) => {
        console.log(filePath)
        try {
            if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
                console.log(`Xóa file thành công: ${filePath}`);
            }
        } catch (error) {
            console.error(`Lỗi khi xóa file ${filePath}:`, error);
        }
    };

    export const uploadImage = async (file: Express.Multer.File, type: string, upload_type: string, module_code: string, module_id: string, module_type: string, width: string, height: string, name: string) => {
        const userDir = path.join(__dirname, process.env.CATEGORY_UPLOAD_IMAGE_PATH as string);
        const thumbailDir = path.join(userDir, 'thumbnail');

        let fileExtension: string;
        switch (file.mimetype) {
            case 'image/jpeg':
                fileExtension = '.jpeg';
                break;
            case 'image/jpg':
                fileExtension = '.jpg';
                break;
            case 'image/png':
                fileExtension = '.png';
                break;
            default:
                return new HttpException(400, errorMessages.INVALID_FILE);
        }
        UploadImage.createFolderIfNotExist(userDir)
        UploadImage.createFolderIfNotExist(thumbailDir)

        const uploadPath = path.join(userDir, `${type}${fileExtension}`)
        const thumbailPath = path.join(thumbailDir, `${type}${fileExtension}`)

        //check 
        const metadata = await sharp(file.buffer)
            .rotate().metadata();
        const upload = await sharp(file.buffer).toFile(uploadPath)
        if (upload) {
            await sharp(file.buffer)
                .withMetadata()
                .rotate()
                .toFile(uploadPath);
            await sharp(file.buffer).
                resize(350, 350)
                .rotate()
                .toFile(path.join(thumbailDir, `${type}${fileExtension}`));

            const fileBuffer = fs.readFileSync(uploadPath);
            const fileBlob = new Blob([fileBuffer], { type: file.mimetype });
            files.push(fileBlob)
            UploadImage.deleteFileIfExist(uploadPath)
            UploadImage.deleteFileIfExist(thumbailPath)
        }
        return new HttpException(400, errorMessages.UPLOAD_FAILED);
    }
    export const removeVietnameseAccents = (str: string) => {
        const vietnameseAccents = 'àáạảãâấầẩẫậăắằẳẵặèéẹẻẽêếềểễệìíịỉĩòóọỏõôốồổỗộơớờởỡợùúụủũưứừửữựỳýỵỷỹđ';
        const replacement = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiiooooooooooooouuuuuuuuuuuyyyyyd';
        return str
            .split('')
            .map(char => {
                const index = vietnameseAccents.indexOf(char);
                return index !== -1 ? replacement[index] : char;
            })
            .join('')
    }
    export const convertToImageName = (name: string, listImage: any, num?: number) => {
        const nameImage = UploadImage.removeVietnameseAccents(name)
            .replace(/\s+/g, '_')
            .toLowerCase();
        const imageNames = listImage.map((file: string, index: number) => {
            const currentNum = num ? num + index + 1 : index + 1
            return `${nameImage}_${currentNum}`
        })
        return imageNames
    }
    export const awaitUploadImage = async (listImage: any, imageNames: string[], upload_type: string, module_code: string, module_id: string, module_type: string, width: string, height: string, name: string) => {
        const awaitUploadImage = listImage.map(async (file: any, index: number) => {
            const upload = await UploadImage.uploadImage(file, imageNames[index] as string, upload_type, module_code, module_id, module_type, width, height, name);
            return upload
        })
        await Promise.all(awaitUploadImage)
        return await UploadImage.upload(upload_type, module_code, name, module_id)
    }
}

