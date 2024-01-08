const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const cors = require("cors");
const pool = require("./db.js");
const { fileURLToPath } = require("url");

require("dotenv/config");
const {
  storageConfig,
  fileFilter,
  breakpoints,
} = require("./config/uploadConfig.js");
//const { buildEmailMessage } = require("./config/sendMail.js");
const app = express();

const maxSize = 200 * 1024 * 1024; // 10 ميغابايت

const hostNameEnv = process.env.HOST_NAME;
const upload = multer({
  storage: storageConfig,
  fileFilter: fileFilter,
  limits: { fileSize: maxSize}, // حد حجم الملف
});
/**
 * تحويل كائن FormData إلى كائن JavaScript مع التعامل مع حالة خاصة للمفتاح "responsibleParties"
 * @param {FormData} form - كائن FormData الذي يجب تحويله إلى كائن JavaScript
 * @returns {Object} - الكائن JavaScript بعد التحويل
 */
function formDataToObject(form) {
  // الكائن النهائي الذي سيتم بناءه
  const obj = {};

  // الدورة عبر مدخلات FormData
  for (const [key, value] of form.entries()) {
    // تحويل المفاتيح إلى مصفوفة لمعالجة المؤشرات
    const keys = key.replace(/\]/g, "").split("[");

    // استخدام reduce لبناء الكائن بناءً على المفاتيح
    keys.reduce((acc, currentKey, index) => {
      if (index === keys.length - 1) {
        // إذا كان المفتاح هو "responsibleParties"
        if (currentKey === "responsibleParties") {
          // تقسيم القيمة إلى مصفوفة عند الفواصل
          acc[currentKey] = value.split(",");
        } else if (acc[currentKey]) {
          // إذا كان هناك قيمة بالفعل، قم بإضافتها إلى مصفوفة إذا لزم الأمر
          if (!Array.isArray(acc[currentKey])) {
            acc[currentKey] = [acc[currentKey]];
          }

          acc[currentKey].push(value);
        } else if (currentKey === "files") {
          // إذا كان هناك قيمة بالفعل، قم بإضافتها إلى مصفوفة إذا لزم الأمر
          if (!Array.isArray(value)) {
            acc[currentKey] = [value];
          }
        } else {
          // إلا، قم بتعيين القيمة
          acc[currentKey] = value;
        }
      } else {
        // إذا لم تكن هذه آخر مؤشر، قم بتكوين الكائن الداخلي
        acc[currentKey] = acc[currentKey] || {};
      }
      return acc[currentKey];
    }, obj);
  }

  return obj;
}
app.use(cors());

app.use("/uploads", express.static("uploads"));

app.post(
  "/uploads",
  upload.array("files", 10),
  async (req, res, next) => {
    try {
      const files = req.files;
      const expectedContentLength = parseInt(req.get("Content-Length"));
      
      const body = req.body;
      console.log('rrrrrrrr',files, body,req.get("host"));

      if (!files || files.length === 0) {
        return res.status(400).send("لم يتم تحميل أي ملف");
      }

      const processedFiles = [];
      const processedVideos = [];
      const attachmentsList = [];
      for (const file of files) {
        
        // إذا كان النوع هو صورة، نقوم بمعالجتها
        if (file.mimetype.startsWith("image/")) {
          const format = path.extname(file.originalname);

          const { width, height } = await sharp(file.path).metadata();
          const aspectRatio = width / height;
          attachmentsList.push({
            filename: file.filename,
            type: file.mimetype,
            path: `${hostNameEnv}${file.destination}/${
              width > 300 ? "thumbnail_" : ""
            }${file.filename}`,
            cid: `unique@${file.filename.split(".")[0]}.cid`,
          });
          const imagesFormat = [];
          for (const size of breakpoints) {
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

              imagesFormat.push({
                name: size.name,
                width: newWidth,
                height: newHeight,
                media_type:"image",
                ext: format,
                url: `${hostNameEnv}${resizedImagePath}`,
              });
            }
          }

          processedFiles.push({
            url: `${hostNameEnv}${file.destination}/${file.filename}`,
            width,
            height,
            media_type: "image",
            ext: format,
            imagesFormat,
          });
        } else if (file.mimetype.startsWith("video/")) {
          // إذا كان النوع هو فيديو، نقوم بإضافته مباشرةً
          
          attachmentsList.push({
            filename: file.filename,
            type: file.mimetype,
            media_type: "video",
            path: `${hostNameEnv}${file.destination}/${file.filename}`,
            cid: `unique@${file.filename.split(".")[0]}.cid`,
          });
          processedVideos.push({
            url: `${hostNameEnv}${file.destination}/${file.filename}`,
            type: file.mimetype,
            media_type: "video",
            ext: path.extname(file.originalname),
          });
        }
      }
     
     
      pool.getConnection((error, connection) => {
        if (error) {
          console.error("خطأ في الحصول على اتصال من المجموعة:", error);
          return res.status(500).json({ error: "حدث خطأ داخلي" });
        }
        console.log(typeof body.termsAndPrivacy, body.responsibleParties);
        // تسجيل البيانات في جدول الحوادث (Incidents)
        connection.query(
          `INSERT INTO Incidents (
        termsAndPrivacy,
        responsibleParties,
        hasCasualties,
        crimeType_title,
        crimeType_category,
        crimeDescription,
        crimeLocation,
        date_sent,
        crimeDate,
        relation,
        email,
        phone,
        address,
        name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?)`,
          [
            body.termsAndPrivacy === "true",
            body.responsibleParties,
            body.hasCasualties,
            body.crimeType.title,
            body.crimeType.category,
            body.crimeDescription,
            body.crimeLocation,
            new Date(),
            new Date(body.crimeDate),
            body.relation,
            body.email,
            body.phone,
            body.address,
            body.name,
          ],
          (error, results) => {
            connection.release(); // إعادة الاتصال إلى المجموعة بمجرد الانتهاء
            if (error) {
              console.error("خطأ في تسجيل البيانات في جدول الحوادث:", error);
              res.status(500).json({ error: "حدث خطأ داخلي" });
            } else {
              const incident_Id = results.insertId;
              // الباقي من العمليات الخاصة بالضحايا والصور والفيديوهات
              // بعد إضافة الحادثة إلى الجدول Incidents
              // تخزين معلومات الصور
              for (const image of processedFiles) {
                connection.query(
                  `INSERT INTO Images (incident_Id, url, width, height,media_type, ext) VALUES (?, ?, ?, ?,?, ?)`,
                  [
                    incident_Id,
                    image.url,
                    image.width,
                    image.height,
                    image.media_type,
                    image.ext,
                  ],
                  (error, imageResults) => {
                    if (error) {
                      console.error("خطأ في تخزين معلومات الصورة:", error);
                    } else {
                      const image_id = imageResults.insertId;

                      // لكل صيغة في imagesFormat، قم بإضافة البيانات إلى جدول ImageFormats
                      for (const format of image.imagesFormat) {
                        connection.query(
                          `INSERT INTO ImageFormats (image_id, name, width, height, ext,media_type, url) VALUES (?, ?, ?, ?, ?,?, ?)`,
                          [
                            image_id,
                            format.name,
                            format.width,
                            format.height,
                            format.ext,
                            format.media_type,
                            format.url,
                          ],
                          (formatError) => {
                            if (formatError) {
                              console.error(
                                "خطأ في تخزين معلومات صيغة الصورة:",
                                formatError
                              );
                            }
                          }
                        );
                      }
                    }
                  }
                );
              }

              // تخزين معلومات الفيديوهات
              for (const video of processedVideos) {
                connection.query(
                  `INSERT INTO Videos (incident_Id,
                    url,
                    type,
                    media_type,
                    ext) VALUES (?, ?, ?, ?, ?)`,
                  [
                    incident_Id,
                    video.url,
                    video.type,
                    video.media_type,
                    video.ext,
                  ],
                  (error) => {
                    if (error) {
                      console.error("خطأ في تخزين معلومات الفيديو:", error);
                    }
                  }
                );
              }

              // تخزين بيانات الضحايا
              const victimsData = body.victims;
              console.log(victimsData);
              connection.query(
                `INSERT INTO Victims (
                  incident_Id, 
                  typeOfStatistic, 
                  numberOfShohada_total, 
                  numberOfShohada_women, 
                  numberOfShohada_children, 
                  numberOfInjured_total, 
                  numberOfInjured_women, 
                  numberOfInjured_children, 
                  numberOfDisplaced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  incident_Id,
                  victimsData.typeOfStatistic,
                  victimsData.numberOfShohada.total,
                  victimsData.numberOfShohada.women,
                  victimsData.numberOfShohada.children,
                  victimsData.numberOfInjured.total,
                  victimsData.numberOfInjured.women,
                  victimsData.numberOfInjured.children,
                  victimsData.numberOfDisplaced,
                ],
                (error) => {
                  if (error) {
                    console.error("خطأ في تخزين بيانات الضحايا:", error);
                  }
                }
              );

              console.log("تم تسجيل البيانات بنجاح");
              res.status(201).json({ success: true });
            }
          }
        );
      });

      // res.status(201).json({
      //   message: "تم تحميل الملفات بنجاح",
      // });
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ داخلي" });
    }
  },
  (err, req, res, next) => {
    console.log(req.complete, "oooooo");
    // يتم تحديد نوع الخطأ بناءً على الرسالة
    if (err && err.message === "Unexpected end of form") {
      console.error("Unexpected end of fom error:", err);
      // رسالة خطأ مخصصة أو استجابة خاصة يمكنك تحديدها
      res.status(400).json({ error: "تم اكتشاف نهاية غير متوقعة للنموذج" });
      return;
    } else {
      // التعامل مع أي خطأ آخر بشكل افتراضي
      console.error("Unhandled error: ffff", err);
      return res.status(400).json({ error: err.message || err });
    }
  }
);

app.get("/*", (req, res) => {
  const hostName = req.hostname;
  res.status(404).send(`<title>${hostName} | Not Found</title>`);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

// إعداد خوادم البريد الإلكتروني
//  const transporter = nodemailer.createTransport({
//    host: process.env.EMAIL_HOST,
//    port: process.env.EMAIL_PORT,
//    secure: false, // إذا كنت تستخدم SSL/TLS للاتصال، غير هذا إلى true
//    auth: {
//      user: process.env.EMAIL_USERNAME, // البريد الإلكتروني الخاص بك
//      pass: process.env.EMAIL_PASS, // كلمة مرور البريد الإلكتروني الخاص بك
//    },
//  });

//  // بناء الرسالة
//  const mailOptions = {
//    from: `${body.name} <${body.email}>`, // البريد الإلكتروني الخاص بك
//    to: process.env.EMAIL_USERNAME, // عنوان البريد الإلكتروني الذي تريد إرسال الرسالة إليه
//    subject: body.crimeType.category,
//    html: buildEmailMessage(req.body, attachmentsList),
//  };

//  // إرسال البريد الإلكتروني
//  transporter.sendMail(mailOptions, function (error, info) {
//    if (error) {
//      console.log("حدث خطأ في إرسال البريد الإلكتروني:", error);
//    } else {
//      console.log("تم إرسال البريد الإلكتروني بنجاح:", info.response);
//    }
//  });