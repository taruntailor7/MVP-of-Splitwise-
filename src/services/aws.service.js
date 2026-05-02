import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

let s3;
const root = path.dirname(require.main.filename);

const awsService = {
  init: async () => {
    try {
      s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_KEYID,
          secretAccessKey: process.env.AWS_SECRETKEY,
        },
        signatureVersion: "v4",
      });
      console.log("[AWS] AWS service initialized");
    } catch (error) {
      console.log("[AWS] Error during AWS service initialization");
      throw error;
    }
  },

  uploadFile: async (file, extension, bucketPath = "") => {
    if (!s3) throw new Error("[AWS] AWS service not initialized yet");

    const _uuid = file.uuid || uuidv4();
    try {
      const _file = fs.readFileSync(`${root}/${file.path}`);
      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: `${bucketPath}${_uuid}.${extension}`,
        Body: _file,
        ACL: "public-read",
        ContentType: file.mimetype || "application/octet-stream",
      });
      await s3.send(putObjectCommand);
      return _uuid;
    } catch (error) {
      console.log("[AWS] Error during file upload");
      throw error;
    } finally {
      fs.unlinkSync(`${root}/${file.path}`);
    }
  },

  deleteFile: async (fileUUID, extension, bucketPath = "") => {
    try {
      if (!s3) throw new Error("[AWS] AWS service not initialized yet");
      const deleteObjectCommand = new DeleteObjectCommand({
        Key: `${bucketPath}${fileUUID}.${extension}`,
        Bucket: process.env.AWS_BUCKET,
      });
      await s3.send(deleteObjectCommand);
    } catch (error) {
      console.log("[AWS] Error during file deletion");
      throw error;
    }
  },
};

export default awsService;
