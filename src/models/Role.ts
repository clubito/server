import mongoose from "mongoose";
import { PERMISSIONS } from "./enums";
import { IRoleInterface } from "./Interfaces/IRoleInterface";


export type IRole = IRoleInterface;

export const roleSchema = new mongoose.Schema<IRole>(
    {
        name: { type: String, required: true },
        permissions: [{ type: String, enum: PERMISSIONS }],
        preset: { type: Boolean, default: false }
    },
    { timestamps: true },
);

const Role = mongoose.model<IRole>("Club", roleSchema);

export default Role;