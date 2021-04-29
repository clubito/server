import mongoose from "mongoose";
import { IClub } from "../Club";

export interface IRoleInterface extends mongoose.Document {
    customTitle: string,
    permissions: string[],
    clubId: mongoose.Schema.Types.ObjectId | IClub,
}