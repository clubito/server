import logger from "@logger";
import { Request, Response } from "express";

export const searchClubByName = (req: Request, res: Response): void => {
    logger.error(req.query);
}