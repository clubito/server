import mongoose from "mongoose";
import { CLUB_TAGS } from "./enums";
import { IClubInterface } from "./Interfaces/IClubInterface";


export type IClub = IClubInterface;

export const clubSchema = new mongoose.Schema<IClub>(
    {
        name: {type: String, required: true},
        logo: String,
        description: String,
        members: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
        events: [{type: mongoose.Schema.Types.ObjectId, ref: "Event"}],
        joinRequests: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
        announcements: [{type: mongoose.Schema.Types.ObjectId, ref: "Announcement"}],
        roles: [{
            user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
            customTitle: String
        }],
        theme: String,
        tags: [{type: String, enum: CLUB_TAGS}]
        
    },
    { timestamps: true },
);

const Club = mongoose.model<IClub>("Club", clubSchema);

export default Club;