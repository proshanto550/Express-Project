
export interface IUser {
    id?: number;
    name: string;
    email: string;
    password: string;
    age: number;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
}