import cloudinary from "../config/cloudinary.js";

export function uploadToCloudinary(buffer, folder = "books/images", resource_type = "image") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}