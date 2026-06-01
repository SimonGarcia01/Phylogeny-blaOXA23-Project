export class ResponseUserDto {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;

    constructor(email?: string, firstName?: string, lastName?: string, role?: string) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
    }
}
