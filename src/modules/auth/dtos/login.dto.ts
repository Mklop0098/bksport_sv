import { IsNotEmpty, IsString } from "class-validator";
export class LoginDto {
    @IsNotEmpty()
    @IsString()
    public phone!: string;

    @IsNotEmpty()
    @IsString()
    public password!: string;

    constructor(phone: string, password: string) {
        this.phone = phone;
        this.password = password;
    }
}
export default LoginDto;