import mongoose from "mongoose";
import { IMessageInterface } from "./Interfaces/IMessageInterface";

export type IMessage = IMessageInterface;

const messageSchema = new mongoose.Schema<IMessage>(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        authorName: String,
        club: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
        timestamp: { type: Date, default: Date.now },
        body: String,
        attachment: String
    },
    { timestamps: true },
);

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;