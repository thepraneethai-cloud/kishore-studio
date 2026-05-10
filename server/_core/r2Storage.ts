import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "./env";

function getR2Client() {
  const { r2AccountId, r2AccessKeyId, r2SecretAccessKey } = ENV;
  if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
    throw new Error("R2 not configured: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const { r2BucketName, r2PublicUrl } = ENV;
  if (!r2BucketName) throw new Error("R2_BUCKET_NAME not configured");
  if (!r2PublicUrl) throw new Error("R2_PUBLIC_URL not configured");

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `${r2PublicUrl.replace(/\/$/, "")}/${key}`;
}

export function isR2Configured(): boolean {
  return !!(ENV.r2AccountId && ENV.r2AccessKeyId && ENV.r2SecretAccessKey && ENV.r2BucketName && ENV.r2PublicUrl);
}
