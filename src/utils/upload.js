import multer from "multer";
import path from "path";
import fs from "fs";

const imageDir = "uploads/images/";
const pdfDir = "uploads/pdf/";

[imageDir, pdfDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const uploadPath = isImage ? imageDir : pdfDir;
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const isImageField = file.fieldname === "image";
  const isPdfField = file.fieldname === "pdf";

  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
  const allowedPdfTypes = ["application/pdf"];

  if (isImageField && allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (isPdfField && allowedPdfTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Le champ ${file.fieldname} accepte seulement ${
          isImageField ? "les fichiers image (jpg, jpeg, png)" : "les fichiers PDF"
        }`
      ),
      false
    );
  }
};


export const upload = multer({
  storage,
  fileFilter,
});
