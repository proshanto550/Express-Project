
export interface IUser {
    id?: number;
    name: string;
    email: string;
    password: string;
    role?: string; //admin, agent, user
    created_at?: Date;
    updated_at?: Date;
}