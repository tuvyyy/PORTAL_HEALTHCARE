-- 01_schema.sql

IF DB_ID('PatientDoctorPortal') IS NULL
BEGIN
  CREATE DATABASE PatientDoctorPortal;
END;
GO

USE PatientDoctorPortal;
GO

-- Drop existing (dev only)
IF OBJECT_ID('dbo.PrescriptionItems','U') IS NOT NULL DROP TABLE dbo.PrescriptionItems;
IF OBJECT_ID('dbo.Prescriptions','U') IS NOT NULL DROP TABLE dbo.Prescriptions;
IF OBJECT_ID('dbo.LabResults','U') IS NOT NULL DROP TABLE dbo.LabResults;
IF OBJECT_ID('dbo.MedicalRecords','U') IS NOT NULL DROP TABLE dbo.MedicalRecords;
IF OBJECT_ID('dbo.Appointments','U') IS NOT NULL DROP TABLE dbo.Appointments;
IF OBJECT_ID('dbo.DoctorSchedules','U') IS NOT NULL DROP TABLE dbo.DoctorSchedules;
IF OBJECT_ID('dbo.MessageThreads','U') IS NOT NULL DROP TABLE dbo.MessageThreads;
IF OBJECT_ID('dbo.Messages','U') IS NOT NULL DROP TABLE dbo.Messages;
IF OBJECT_ID('dbo.Doctors','U') IS NOT NULL DROP TABLE dbo.Doctors;
IF OBJECT_ID('dbo.Patients','U') IS NOT NULL DROP TABLE dbo.Patients;
IF OBJECT_ID('dbo.Users','U') IS NOT NULL DROP TABLE dbo.Users;
GO

CREATE TABLE Users (
  UserId INT IDENTITY(1,1) PRIMARY KEY,
  Email NVARCHAR(255) NOT NULL UNIQUE,
  PasswordHash NVARCHAR(255) NOT NULL,
  FullName NVARCHAR(255) NOT NULL,
  Phone NVARCHAR(50) NULL,
  Gender NVARCHAR(10) NULL,
  DOB DATE NULL,
  Role NVARCHAR(20) NOT NULL, -- patient | doctor | admin
  Status NVARCHAR(20) NOT NULL DEFAULT 'active',
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL
);

CREATE TABLE Doctors (
  DoctorId INT IDENTITY(1,1) PRIMARY KEY,
  UserId INT NOT NULL UNIQUE REFERENCES Users(UserId),
  Specialty NVARCHAR(100) NOT NULL,
  Bio NVARCHAR(1000) NULL,
  Room NVARCHAR(50) NULL,
  Level NVARCHAR(50) NULL
);

CREATE TABLE Patients (
  PatientId INT IDENTITY(1,1) PRIMARY KEY,
  UserId INT NOT NULL UNIQUE REFERENCES Users(UserId),
  Address NVARCHAR(255) NULL,
  InsuranceNo NVARCHAR(100) NULL
);

CREATE TABLE DoctorSchedules (
  ScheduleId INT IDENTITY(1,1) PRIMARY KEY,
  DoctorId INT NOT NULL REFERENCES Doctors(DoctorId),
  WorkDate DATE NOT NULL,
  SlotStart TIME NOT NULL,
  SlotEnd TIME NOT NULL,
  MaxPatients INT NOT NULL DEFAULT 10
);

CREATE TABLE Appointments (
  AppointmentId INT IDENTITY(1,1) PRIMARY KEY,
  PatientId INT NOT NULL REFERENCES Patients(PatientId),
  DoctorId INT NOT NULL REFERENCES Doctors(DoctorId),
  ScheduleId INT NOT NULL REFERENCES DoctorSchedules(ScheduleId),
  Reason NVARCHAR(500) NULL,
  Status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|approved|done|cancelled
  BookedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE MedicalRecords (
  RecordId INT IDENTITY(1,1) PRIMARY KEY,
  AppointmentId INT NOT NULL REFERENCES Appointments(AppointmentId),
  DoctorId INT NOT NULL REFERENCES Doctors(DoctorId),
  Summary NVARCHAR(1000) NULL,
  Diagnosis NVARCHAR(1000) NULL,
  Note NVARCHAR(1000) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Prescriptions (
  PrescriptionId INT IDENTITY(1,1) PRIMARY KEY,
  RecordId INT NOT NULL REFERENCES MedicalRecords(RecordId),
  DoctorId INT NOT NULL REFERENCES Doctors(DoctorId),
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE PrescriptionItems (
  ItemId INT IDENTITY(1,1) PRIMARY KEY,
  PrescriptionId INT NOT NULL REFERENCES Prescriptions(PrescriptionId),
  DrugName NVARCHAR(255) NOT NULL,
  Dosage NVARCHAR(255) NOT NULL,
  Frequency NVARCHAR(255) NOT NULL,
  Days INT NOT NULL DEFAULT 1,
  Note NVARCHAR(500) NULL
);

CREATE TABLE LabResults (
  ResultId INT IDENTITY(1,1) PRIMARY KEY,
  RecordId INT NOT NULL REFERENCES MedicalRecords(RecordId),
  Title NVARCHAR(255) NOT NULL,
  ResultText NVARCHAR(2000) NULL,
  FilePath NVARCHAR(500) NULL,
  UploadedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE MessageThreads (
  ThreadId INT IDENTITY(1,1) PRIMARY KEY,
  PatientId INT NOT NULL REFERENCES Patients(PatientId),
  DoctorId INT NOT NULL REFERENCES Doctors(DoctorId),
  LastMsgAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Messages (
  MessageId INT IDENTITY(1,1) PRIMARY KEY,
  ThreadId INT NOT NULL REFERENCES MessageThreads(ThreadId),
  FromUserId INT NOT NULL REFERENCES Users(UserId),
  ToUserId INT NOT NULL REFERENCES Users(UserId),
  Content NVARCHAR(2000) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX IX_DoctorSchedules_DoctorDate ON DoctorSchedules(DoctorId, WorkDate);
CREATE INDEX IX_Appointments_DoctorDate ON Appointments(DoctorId, Status, BookedAt);
CREATE INDEX IX_Messages_Thread ON Messages(ThreadId, CreatedAt DESC);
GO
