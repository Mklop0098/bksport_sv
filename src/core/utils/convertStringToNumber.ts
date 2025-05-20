export class ConvertStringToNumber {
    public static convertStringToNumber(value: string): number {
        if (value != undefined && value != null && value != "")
            return parseInt(value);
        return 0;
    }
    public static convertStringToFloat(value: string): number {
        if (value != undefined && value != null && value != "")
            return parseFloat(value);
        return 0;
    }
}