import mongoose from "mongoose";
import { ClubInterface } from "./Interfaces/ClubInterface";

export type EventDocument = mongoose.Document & ClubInterface;

const eventSchema = new mongoose.Schema<EventDocument>(
    {
        name: {type: String, required: true},
        description: String,
        startTime: Date,
        endTime: Date,
        longitude: Number,
        latitude: Number,
        shortLocation: String,
        picture: String,
        club: {type: mongoose.Schema.Types.ObjectId, ref: "Club"},
        lastUpdated: Date
    },
    { timestamps: true },
);

export const Event = mongoose.model<EventDocument>("Event", eventSchema);