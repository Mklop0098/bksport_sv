
import message from "@core/config/constants";

export enum EAction {
    CREATE = message.ACTION_CREATE as any,
    UPDATE = message.ACTION_UPDATE as any,
    DELETE = message.ACTION_DELETE as any,
    INDEX = message.ACTION_INDEX as any,
    PUBLISH = message.ACTION_PUBLISH as any,
    STATUS = message.ACTION_STATUS as any,
    IMPORT = message.ACTION_IMPORT as any,
    EXPORT = message.ACTION_EXPORT as any,
    REPORT = message.ACTION_REPORT as any,
}
export enum EActionValue {
    CREATE = message.ACTION_CREATE_VALUE as any,
    UPDATE = message.ACTION_UPDATE_VALUE as any,
    DELETE = message.ACTION_DELETE_VALUE as any,
    INDEX = message.ACTION_INDEX_VALUE as any,
    PUBLISH = message.ACTION_PUBLISH_VALUE as any,
    IMPORT = message.ACTION_IMPORT_VALUE as any,
    EXPORT = message.ACTION_EXPORT_VALUE as any,
    REPORT = message.ACTION_REPORT_VALUE as any,
}
export interface IAction {
    name: EAction;
    action: EActionValue;
    status: number;
}