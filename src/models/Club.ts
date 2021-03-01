import mongoose from "mongoose";
import { ClubInterface } from "./Interfaces/ClubInterface";


export type ClubDocument = mongoose.Document & ClubInterface;

const clubSchema = new mongoose.Schema<ClubDocument>(
    {
        name: {type: String, required: true},
        logo: String,
        description: String,
        members: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
        events: [{type: mongoose.Schema.Types.ObjectId, ref: "Event"}],
        joinRequests: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
        roles: String,
        theme: String,
        
    },
    { timestamps: true },
);

export const Club = mongoose.model<ClubDocument>("Club", clubSchema);