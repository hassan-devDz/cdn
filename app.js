import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import {
  storageConfig,
  fileFilter,
  breakpoints,
} from "./config/uploadConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const maxSize = 10 * 1024 * 1024; // 10 ميغابايت

const hostNameEnv = process.env.HOST_NAME;

const upload = multer({
  storage: storageConfig,
  fileFilter: fileFilter,
  limits: { fileSize: maxSize }, // حد حجم الملف
});

app.use("/uploads", express.static("uploads"));

app.post("/uploads", upload.array("files", 10), async (req, res, next) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      throw new Error("لم يتم تحميل أي ملف");
    }

    const processedImages = await Promise.all(
      files.map(async (file) => {
        if (!file.mimetype.startsWith("image/")) {
          throw new Error("نوع الملف غير مدعوم");
        }

        const ext = path.extname(file.originalname);
        const { width, height } = await sharp(file.path).metadata();
        const aspectRatio = width / height;
        const imagesFormat = await Promise.all(
          breakpoints.map(async (size) => {
            // حساب العرض والارتفاع الجديدين بحيث يكونان أقل من أو يساويان الحجم المطلوب

            if (width > size.width) {
              const resizedImagePath = `${file.destination}/${size.name}_${file.filename}`;
              let newWidth, newHeight;
              if (width > height) {
                newWidth = size.width;
                newHeight = Math.round(size.width / aspectRatio);
              } else {
                newHeight = size.width;
                newWidth = Math.round(size.width * aspectRatio);
              }

              await sharp(file.path)
                .resize(newWidth, newHeight)
                .toFile(resizedImagePath);

              
              return {
                name: size.name,
                width: newWidth,
                height: newHeight,
                ext,
                createdAt: new Date().toISOString(),
                url: `${hostNameEnv}${resizedImagePath}`,
              };
            }
            return null;
          })
        );
        return {
          url: `${hostNameEnv}${file.destination}/${file.filename}`,
          width,
          height,
          ext,
          createdAt: new Date().toISOString(),

          imagesFormat,
        };
      })
    );

    return res.status(201).json({ images: processedImages });
  } catch (error) {
    next(error);
  }
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "حدث خطأ داخلي" });
});

app.get("/*", (req, res) => {
  const hostName = req.hostname;
  res.status(404).send(`<title>${hostName} | Not Found</title>`);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});



