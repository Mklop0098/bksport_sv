import { IsNotEmpty, IsString } from "class-validator";
export class ChangePasswordDto {

    @IsNotEmpty()
    @IsString()
    public password!: string;

    @IsNotEmpty()
    @IsString()
    public newPassword!: string;

    id?: number;

    constructor(password: string, newPassword: string, id?: number) {
        this.password = password;
        this.newPassword = newPassword;
        this.id = id;
    }
}
export default ChangePasswordDto