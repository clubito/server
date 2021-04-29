import mongoose from "mongoose";
import { PERMISSIONS } from "./enums";
import { IRoleInterface } from "./Interfaces/IRoleInterface";


export type IRole = IRoleInterface;

export const roleSchema = new mongoose.Schema<IRole>(
    {
        customTitle: { type: String, required: true },
        permissions: [{ type: String, enum: PERMISSIONS }],
        clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club" }
    },
    { timestamps: true },
);

const Role = mongoose.model<IRole>("Club", roleSchema);

export default Role;