import mongoose from "mongoose";

export interface IRoleInterface extends mongoose.Document {
    name: string,
    permissions: string[],
    preset: boolean
}