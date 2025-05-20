import fs from 'fs';

const checkCardIfExist = async (card: any, dir: string, chars: string) => {
    if (card == undefined && fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        if (files.length > 0) {
            const card = fs.readdirSync(dir).filter((item: any) => item.includes(chars));
            if (card)
                return true
        }
    } return false
}

export default checkCardIfExist;