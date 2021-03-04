import { Request, Response } from "express";
import { getPresignedUrl } from "../../util/aws_s3"

export const getS3PresignedUrl = (req: Request, res: Response): void => {
    const filename: String = req.params.filename;
    const url: String = getPresignedUrl(filename);
    res.status(200).json({
        message: "Get S3 presigned url successful",
        presignedUrl: url
    })
}
