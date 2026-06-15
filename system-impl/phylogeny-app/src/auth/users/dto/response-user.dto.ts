export class ResponseUserDto {
    id?: number;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;

    constructor(id?: number, email?: string, firstName?: string, lastName?: string, role?: string) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
    }
}
