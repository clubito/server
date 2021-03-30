import mongoose from "mongoose";

export interface INotificationInterface {
    body?: string,
    title?: string,
    data?: {
        type?: string,
        id?: string,
        title?: string,
        role?: string
    }
}