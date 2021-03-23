import { boolean } from "joi";
import mongoose from "mongoose";
import { CLUB_ROLE, CLUB_TAGS, JOIN_REQUEST_STATUS } from "./enums";
import { IClubInterface } from "./Interfaces/IClubInterface";


export type IClub = IClubInterface;

export const clubSchema = new mongoose.Schema<IClub>(
    {
        name: { type: String, required: true },
        logo: { type: String, default: "https://picsum.photos/200" },
        description: String,
        members: [{
            member: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            role: { type: String, enum: CLUB_ROLE }
        }],
        events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
        joinRequests: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            status: { type: String, enum: JOIN_REQUEST_STATUS },
            requestedAt: { type: Date, default: Date.now }
        }],
        announcements: [{ type: mongoose.Schema.Types.ObjectId, ref: "Announcement" }],
        roles: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            customTitle: String
        }],
        theme: String,
        tags: [{ type: String, enum: CLUB_TAGS }],
        isEnabled: { type: Boolean, default: false },
        deleted: {
            isDeleted: Boolean,
            deletedAt: Date
        }

    },
    { timestamps: true },
);

const Club = mongoose.model<IClub>("Club", clubSchema);

export default Club;