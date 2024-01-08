-- جدول الحوادث (Incidents)
CREATE TABLE Incidents (
  status BOOLEAN DEFAULT NULL,
  incident_id INT AUTO_INCREMENT PRIMARY KEY,
  termsAndPrivacy BOOLEAN,
  responsibleParties VARCHAR(255),
  hasCasualties VARCHAR(10),
  crimeType_title VARCHAR(255),
  crimeType_category VARCHAR(255),
  crimeDescription TEXT,
  crimeLocation VARCHAR(255),
  crimeDate DATETIME,
  relation VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address VARCHAR(255),
  name VARCHAR(255)
);

-- جدول الضحايا (Victims)
CREATE TABLE Victims (
  victim_id INT AUTO_INCREMENT PRIMARY KEY,
  incident_id INT,
  typeOfStatistic VARCHAR(50), 
  numberOfShohada_total INT, 
  numberOfShohada_women INT, 
  numberOfShohada_children INT, 
  numberOfInjured_total INT, 
  numberOfInjured_women INT, 
  numberOfInjured_children INT, 
  numberOfDisplaced INT,
  FOREIGN KEY (incident_id) REFERENCES Incidents(incident_id)
);

-- جدول الصور (Images)
CREATE TABLE Images (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  incident_id INT,
  url VARCHAR(255),
  width INT,
  height INT,
  media_type VARCHAR(10),
  ext VARCHAR(10),
  FOREIGN KEY (incident_id) REFERENCES Incidents(incident_id)
);

-- جدول تنسيقات الصور (ImageFormats)
CREATE TABLE ImageFormats (
  format_id INT AUTO_INCREMENT PRIMARY KEY,
  image_id INT,
  name VARCHAR(50),
  width INT,
  height INT,
  media_type VARCHAR(10),
  ext VARCHAR(10),
  url VARCHAR(255),
  FOREIGN KEY (image_id) REFERENCES Images(image_id)
);

-- جدول الفيديوهات (Videos)
CREATE TABLE Videos (
  video_id INT AUTO_INCREMENT PRIMARY KEY,
  incident_id INT,
  url VARCHAR(255),
  type VARCHAR(50),
  media_type VARCHAR(10),
  ext VARCHAR(10),
  FOREIGN KEY (incident_id) REFERENCES Incidents(incident_id)
);
