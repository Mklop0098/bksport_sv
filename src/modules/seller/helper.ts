import errorMessages from "@core/config/constants";
import { HttpException } from "@core/exceptions";
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { CreateDto as SellerAddressDto} from "@modules/sellerAddress/dtos/create.dto";
import SellerAddressService from "@modules/sellerAddress/service";
const createFolderIfNotExist = (dir: string) => {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
}

const uploadImage = async (code: string, file: Express.Multer.File, position?: string) => {
    const allowedFile = ['.png', '.jpg', '.jpeg', ".pdf"]
    if (!allowedFile.includes(path.extname(file.originalname)))
        return new HttpException(400, errorMessages.INVALID_FILE);
    const userDir = path.join(__dirname, process.env.SELLER_UPLOAD_IMAGE_PATH as string, code, position ? position : '');

    createFolderIfNotExist(userDir)
    const fileExtension = path.extname(file.originalname);
    const uploadPath = path.join(userDir, `${code}${fileExtension}`)

    const files = fs.readdirSync(userDir);
    for (const fileName of files) {
        fs.unlinkSync(path.join(userDir, fileName));
    }
    if (fileExtension === '.pdf') {
        fs.writeFileSync(uploadPath, file.buffer);
    } else {
        try {
            await sharp(file.buffer).toFile(uploadPath);
        } catch (error) {
            return new HttpException(400, errorMessages.UPLOAD_FAILED);
        }
    }
    const relativePath = path.relative(
        path.join(__dirname, process.env.USER_UPLOAD_IMAGE_PATH as string, '..'),
        uploadPath
    );
    return relativePath;
}

export const upload = async (imageMimeTypes: string[], file: any, code: string, fileName?: string) => {
    if (!imageMimeTypes.includes(file.mimetype))
        return new HttpException(400, errorMessages.INVALID_FILE);
    const upload = await uploadImage(code, file, fileName);
    if (upload instanceof HttpException) {
        return new HttpException(400, errorMessages.UPLOAD_FAILED)
    }
    return upload as string;
}

export const createFolder = async (avatar: any, background: any, certificate_image: any, identity_front_img: any, identity_back_img: any, code: string) => {
    let pathAvatar
    if (avatar != undefined) {
        const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        pathAvatar = await upload(imageMimeTypes, avatar, code)
    }
    let pathBackground
    if (background != undefined) {
        const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        pathBackground = await upload(imageMimeTypes, background, code, 'background')
    }
    let pathCertificate
    if (certificate_image != undefined) {
        const imageMimeTypes = ['application/pdf'];
        pathCertificate = await upload(imageMimeTypes, certificate_image, code, 'certificate_image')
    }
    let pathIdentityFrontImg
    if (identity_front_img != undefined) {
        const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        pathIdentityFrontImg = await upload(imageMimeTypes, identity_front_img, code, 'identity_front_img')
    }
    let pathIdentityBackImg
    if (identity_back_img != undefined) {
        const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        pathIdentityBackImg = await upload(imageMimeTypes, identity_back_img, code, 'identity_back_img')
    }
    return {pathAvatar, pathBackground, pathCertificate, pathIdentityBackImg, pathIdentityFrontImg}
}
