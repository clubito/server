import mongoose from "mongoose";
import { IEventInterface } from "./Interfaces/IEventInterface";

export type IEvent = IEventInterface;

const eventSchema = new mongoose.Schema<IEvent>(
    {
        name: { type: String, required: true },
        description: String,
        startTime: Date,
        endTime: Date,
        longitude: Number,
        latitude: Number,
        shortLocation: String,
        picture: { type: String, default: "https://picsum.photos/200" },
        club: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
        lastUpdated: { type: Date, default: Date.now },
        rsvpUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        isOpen: { type: Boolean, default: false }
    },
    { timestamps: true },
);

const Event = mongoose.model<IEvent>("Event", eventSchema);

export default Event;