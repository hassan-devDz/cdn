const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// تحقق من نهاية الملف


// حدد الحجم الأقصى للملف
const maxSize = 10 * 1024 * 1024; // 10 ميغابايت

// تحديد أنواع الملفات المسموح بها
const allowedTypes = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/mpeg",
  "video/quicktime", // لملفات MOV
  "video/webm", // لملفات WebM
  "video/ogg", // لملفات Ogg
];

const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".mp4",
  ".mpeg",
  ".mov", // امتداد لملفات MOV
  ".webm", // امتداد لملفات WebM
  ".ogg", // امتداد لملفات Ogg
];


// تحديد اسم المجلد استنادًا إلى الطلب
function determineFolderName(req) {
  const serverName = req.get("origin"); // أو استخدم req.ip لعنوان IP
  return serverName.replace(/[^a-zA-Z0-9]/g, "_"); // استبدال الأحرف غير الآمنة
}

const createUniqueFileName = (originalName) => {
  const extension = path.extname(originalName);
  const uniqueId = uuidv4().replace(/-/g, ""); // إزالة الفواصل
  const fileNameWithoutExtension = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9]/g, "_");

  return `${fileNameWithoutExtension}_${uniqueId}${extension}`;
};

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
    cb(null, `${Date.now()}_${createUniqueFileName(file.originalname)}`);
  },
});

// فلترة الملفات المسموح بها
function fileFilter(req, file, cb) {

  try {
    const getOrigin = req.get("origin")
    
    const extname = path.extname(file.originalname).toLowerCase();
    const mimeTypeAllowed = allowedTypes.includes(file.mimetype);
    const extnameAllowed = allowedExtensions.includes(extname);
    if ( getOrigin === "null" || !getOrigin) {
      return cb(new Error("أصل الصفحة في الطلب مفقود"), false);
    }
    if (!file ) {
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
    
    return cb(new Error("حدث خطأ في تحميل الملف"), false);
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
module.exports = { storageConfig: storage, fileFilter, breakpoints };
