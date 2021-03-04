import AWS from "aws-sdk";
AWS.config.update({ accessKeyId: process.env.AWS_KEY, secretAccessKey: process.env.AWS_SECRET, region: process.env.BUCKET_REGION })
const s3 = new AWS.S3();

export const getPresignedUrl = function (filename: String) {
    const signedUrlExpireSeconds = 60; // 1 minute

    const url = s3.getSignedUrl('putObject', {
        Bucket: process.env.BUCKET_NAME,
        Key: filename,
        Expires: signedUrlExpireSeconds,
    })

    return url;
}