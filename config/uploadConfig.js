import multer from "multer";
import path from "path";
import fs from "fs";

// حدد الحجم الأقصى للملف
const maxSize = 10 * 1024 * 1024; // 10 ميغابايت

// تحديد أنواع الملفات المسموح بها
const allowedTypes = ["image/jpeg", "image/png"];
const allowedExtensions = [".jpg", ".jpeg", ".png"];

// تحديد اسم المجلد استنادًا إلى الطلب
function determineFolderName(req) {
  const serverName = req.hostname; // أو استخدم req.ip لعنوان IP
  return serverName.replace(/[^a-zA-Z0-9]/g, "_"); // استبدال الأحرف غير الآمنة
}

// إعدادات التخزين لـ multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folderName = determineFolderName(req);
    const uploadDir = path.join("uploads", folderName); // إنشاء مسار المجلد

    // التأكد من وجود المجلد وإنشاؤه إذا لم يكن موجودًا
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // استخراج اسم الملف بدون امتداد
    const fileNameWithoutExtension = path.basename(
      file.originalname,
      path.extname(file.originalname)
    ).replace(/[^a-zA-Z0-9]/g, "_");
    console.log(fileNameWithoutExtension);
    cb(
      null,`${file.fieldname}-${Date.now()}-${fileNameWithoutExtension}${path.extname(file.originalname)}`
       
        
    );
  },
});

// فلترة الملفات المسموح بها
function fileFilter(req, file, cb) {
  try {
    const extname = path.extname(file.originalname).toLowerCase();
    const mimeTypeAllowed = allowedTypes.includes(file.mimetype);
    const extnameAllowed = allowedExtensions.includes(extname);

    if (!file) {
      return cb(new Error("لم يتم تحميل أي ملف"), false);
    }

    if (mimeTypeAllowed && extnameAllowed) {
      cb(null, true);
    } else {
      cb(
        new Error("نوع الملف غير صالح. يُسمح فقط بالصور وملفات الفيديو"),
        false
      );
    }
  } catch (error) {
    console.log(error);
    cb(new Error("حدث خطأ في تحميل الملف"), false);
  }
}

// تحديد أحجام الصور لإنشاء المصغرات
const breakpoints = [
  { name: "xlarge", width: 1920 },
  { name: "large", width: 1000 },
  { name: "medium", width: 750 },
  { name: "small", width: 500 },
  { name: "thumbnail", width: 300 },
];

// تصدير الإعدادات
export { storage as storageConfig, fileFilter, breakpoints };
