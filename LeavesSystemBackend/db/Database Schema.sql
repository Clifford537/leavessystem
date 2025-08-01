-- Create table: jobgroup
CREATE TABLE jobgroup (
    ID INT(11) NOT NULL AUTO_INCREMENT,
    Name VARCHAR(20),
    Code VARCHAR(10),
    PRIMARY KEY (ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create table: jobtitles
CREATE TABLE jobtitles (
    ID INT(11) NOT NULL AUTO_INCREMENT,
    Name VARCHAR(100),
    PRIMARY KEY (ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create table: leave_types
CREATE TABLE leave_types (
    ID INT(11) NOT NULL AUTO_INCREMENT,
    Name VARCHAR(100),
    Male INT(11) DEFAULT 0,
    Female INT(11) DEFAULT 0,
    PRIMARY KEY (ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create table: staff
CREATE TABLE staff (
    ID INT(11) NOT NULL AUTO_INCREMENT,
    Fullname VARCHAR(255),
    Staffno VARCHAR(20) NOT NULL,
    IDno VARCHAR(20),
    DocType ENUM('ID', 'PASSPORT') DEFAULT 'ID',
    PINno VARCHAR(20),
    NHIF VARCHAR(20),
    NSSF VARCHAR(20),
    Address VARCHAR(100),
    Address2 VARCHAR(100),
    Cellphone VARCHAR(20),
    HomeTel VARCHAR(20),
    NextofKin VARCHAR(100),
    NextofKinTel VARCHAR(20),
    ContractID INT(11),
    Jobgroup VARCHAR(20),
    JobTitle VARCHAR(50),
    Department VARCHAR(50),
    Gender ENUM('Male', 'Female'),
    DOB DATE,
    Pass VARCHAR(100),
    Userright ENUM('Hr', 'Staff') DEFAULT 'Staff',
    PRIMARY KEY (ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create table: leave_transactions
CREATE TABLE leave_transactions (
    ID INT(11) NOT NULL AUTO_INCREMENT,
    StaffID INT(11),
    LeaveTypeID INT(11) DEFAULT 0,
    fDate DATETIME,
    tDate DATETIME,
    Notes VARCHAR(200),
    DaysDiff DOUBLE(8,3) DEFAULT 0.000,
    Approved ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    UserID INT(11) DEFAULT 0,
    ApprovedID INT(11) DEFAULT 0,
    Attachment  text  NULL
    PRIMARY KEY (ID),
    FOREIGN KEY (StaffID) REFERENCES staff(ID),
    FOREIGN KEY (LeaveTypeID) REFERENCES leave_types(ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create table: staffpics
CREATE TABLE staffpics (
    ID INT(11) NOT NULL AUTO_INCREMENT,
    StaffID INT(11),
    Pic LONGBLOB,
    PRIMARY KEY (ID),
    FOREIGN KEY (StaffID) REFERENCES staff(ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create table: staff_banks
CREATE TABLE staff_banks (
    ID INT(11) NOT NULL AUTO_INCREMENT,
    Employee INT(11),
    AccountNo VARCHAR(50),
    Bank VARCHAR(100),
    Code VARCHAR(20),
    PRIMARY KEY (ID),
    FOREIGN KEY (Employee) REFERENCES staff(ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


ALTER TABLE  leave_transactions ADD COLUMN AttachmentPreview VARCHAR(255);
ALTER TABLE leave_transactions
ADD COLUMN AttachmentLink VARCHAR(2083) NULL;
