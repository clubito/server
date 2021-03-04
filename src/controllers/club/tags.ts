import { Request, Response } from "express";
import { CLUB_TAGS } from "@models/enums";

export const getAllTags = (req: Request, res: Response): void => {
    const allTags = Object.values(CLUB_TAGS);

    const properCaseAllTags = allTags.map(tag => {
        return tag.toLowerCase()
            .split(" ")
            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(" ");
    });

    res.status(200).json({ tags: properCaseAllTags });

    return;
};

