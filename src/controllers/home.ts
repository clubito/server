  
import { Request, Response } from "express";

/**
 * GET /
 * Home page.
 */
export const index = (_req: Request, res: Response) : void => {
    res.set("Access-Control-Allow-Origin", "*");
    res.json([{
      name: "amarto",
      email: "test@example.com",
      human: true
    },
    {
      name: "aashir",
      email: "aumir@example.com",
      human: true
    },
    {
      name: "sam",
      email: "robot@example.com",
      human: false
    }]);
    return;
};