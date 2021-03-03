import mongoose from "mongoose";
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
        roles: String,
        theme: String,
        
    },
    { timestamps: true },
);

const Club = mongoose.model<IClub>("Club", clubSchema);

export default Club;