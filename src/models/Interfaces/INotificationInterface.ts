import { IRole } from "@models/Role";

export interface INotificationInterface {
    body?: string,
    title?: string,
    data?: {
        type?: string,
        id?: string,
        title?: string,
        role?: IRole
    }
}