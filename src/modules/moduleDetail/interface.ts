
import message from "@core/config/constants";

export enum EAction {
    CREATE = message.ACTION_CREATE as any,
    UPDATE = message.ACTION_UPDATE as any,
    DELETE = message.ACTION_DELETE as any,
    INDEX = message.ACTION_INDEX as any,
}


// export interface IModuleDetail {
//     "name": "sdas",
//     "action": "aasd",
//     "sort": 1
// }