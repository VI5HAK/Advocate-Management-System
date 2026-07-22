
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS STATES (
    STATE_CODE INT PRIMARY KEY,
    STATE_NAME VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS DISTRICTS (
    DISTRICT_CODE INT PRIMARY KEY,
    STATE_CODE INT NOT NULL,
    DISTRICT_NAME VARCHAR(100) NOT NULL,

    UNIQUE(STATE_CODE, DISTRICT_CODE),

    FOREIGN KEY (STATE_CODE)
        REFERENCES STATES(STATE_CODE)
);

CREATE TABLE IF NOT EXISTS TALUKS (
    TALUK_CODE INT PRIMARY KEY,
    DISTRICT_CODE INT NOT NULL,
    TALUK_NAME VARCHAR(100) NOT NULL,

    UNIQUE(DISTRICT_CODE, TALUK_CODE),

    FOREIGN KEY (DISTRICT_CODE)
        REFERENCES DISTRICTS(DISTRICT_CODE)
);

CREATE TABLE IF NOT EXISTS Role_Master (
    Role_ID INT AUTO_INCREMENT PRIMARY KEY,
    Role_Name VARCHAR(100) NOT NULL,
    Role_Description VARCHAR(500),
    Role_Delete_Flag BOOLEAN DEFAULT FALSE,
    Role_Created_By INT,
    Role_Created_Date DATE,
    Role_Modified_Date DATE,
    Role_Modified_By INT
);

CREATE TABLE IF NOT EXISTS Client_Type_Master (
    Client_Type_ID INT AUTO_INCREMENT PRIMARY KEY,
    Client_Type_Name VARCHAR(100) NOT NULL,
    Client_Type_Description VARCHAR(500),
    Client_Type_Delete_Flag BOOLEAN DEFAULT FALSE,
    Client_Type_Created_By INT,
    Client_Type_Created_Date DATE,
    Client_Type_Modified_Date DATE,
    Client_Type_Modified_By INT
);

CREATE TABLE IF NOT EXISTS Case_Type_Master (
    Case_Type_ID INT AUTO_INCREMENT PRIMARY KEY,
    Case_Type_Name VARCHAR(100) NOT NULL,
    Case_Type_Description VARCHAR(500),
    Case_Type_Delete_Flag BOOLEAN DEFAULT FALSE,
    Case_Type_Created_By INT,
    Case_Type_Created_Date DATE,
    Case_Type_Modified_Date DATE,
    Case_Type_Modified_By INT
);

CREATE TABLE IF NOT EXISTS Status_Master (
    Status_ID INT AUTO_INCREMENT PRIMARY KEY,
    Status_Name VARCHAR(100) NOT NULL,
    Status_Description VARCHAR(500),
    Status_Delete_Flag BOOLEAN DEFAULT FALSE,
    Status_Created_By INT,
    Status_Created_Date DATE,
    Status_Modified_Date DATE,
    Status_Modified_By INT
);

CREATE TABLE IF NOT EXISTS Court_Master (
    Court_ID INT AUTO_INCREMENT PRIMARY KEY,
    state_code INT,
    district_code INT,
    taluk_code INT,
    Court_Type ENUM('Supreme Court', 'High Court', 'District Court', 'Family Court', 'Municipal Court', 'Sessions Court'),
    Court_Name VARCHAR(150) NOT NULL,
    Court_Description VARCHAR(500),
    Court_Delete_Flag BOOLEAN DEFAULT FALSE,
    Court_Created_By INT,
    Court_Created_Date DATE,
    Court_Modified_Date DATE,
    Court_Modified_By INT,
    CONSTRAINT FK_Court_State
        FOREIGN KEY (state_code)
        REFERENCES STATES(STATE_CODE),
    CONSTRAINT FK_Court_District
        FOREIGN KEY (district_code)
        REFERENCES DISTRICTS(DISTRICT_CODE),
    CONSTRAINT FK_Court_Taluk
        FOREIGN KEY (taluk_code)
        REFERENCES TALUKS(TALUK_CODE)
);


CREATE TABLE IF NOT EXISTS Advocate_Master (
    Advocate_ID INT AUTO_INCREMENT PRIMARY KEY,

    Advocate_Role_ID INT NOT NULL,

    Advocate_Name VARCHAR(150) NOT NULL,
    Advocate_Address VARCHAR(500),
    Advocate_City VARCHAR(100),
    Advocate_State VARCHAR(100),
    Advocate_Pin_Code INT,

    Advocate_Cnt_Num BIGINT,
    Advocate_Alt_Cnt_Num BIGINT,

    Advocate_Email_ID VARCHAR(150),
    Advocate_PWD VARCHAR(255),
    Advocate_CONF_PWD VARCHAR(255),

    Advocate_PAN_Num VARCHAR(20),
    Advocate_Aadhaar_Num VARCHAR(20),

    Advocate_Delete_Flag BOOLEAN DEFAULT FALSE,

    Advocate_Created_By VARCHAR(100),
    Advocate_Created_Date DATE,

    Advocate_Modified_By VARCHAR(100),
    Advocate_Modified_Date DATE,

    CONSTRAINT FK_Advocate_Role
        FOREIGN KEY (Advocate_Role_ID)
        REFERENCES Role_Master(Role_ID)
);

CREATE TABLE IF NOT EXISTS Client_Master (
    Client_ID INT AUTO_INCREMENT PRIMARY KEY,

    Client_Clnt_Type_ID INT NOT NULL,

    Client_Name VARCHAR(150) NOT NULL,
    Client_Address VARCHAR(500),
    Client_City VARCHAR(100),
    Client_State VARCHAR(100),

    Client_Pin_Code INT,

    Client_Cnt_Num BIGINT,
    Client_Alt_Cnt_Num BIGINT,

    Client_Email_ID VARCHAR(150),

    Client_GST_Num VARCHAR(20),
    Client_PAN_Num VARCHAR(20),
    Client_Aadhaar_Num VARCHAR(20),
    Client_Contact_Person VARCHAR(50),

    Client_Delete_Flag BOOLEAN DEFAULT FALSE,

    Client_Created_By VARCHAR(100),
    Client_Created_Date DATE,

    Client_Modified_By VARCHAR(100),
    Client_Modified_Date DATE,

    CONSTRAINT FK_Client_Type
        FOREIGN KEY (Client_Clnt_Type_ID)
        REFERENCES Client_Type_Master(Client_Type_ID)
);

CREATE TABLE IF NOT EXISTS Case_Master (
    Case_ID INT AUTO_INCREMENT PRIMARY KEY,

    Case_Num VARCHAR(100) NOT NULL,

    Case_Case_Type_ID INT NOT NULL,
    Case_Court_ID INT NOT NULL,
    Case_Advocate_ID INT NOT NULL,

    Case_Petitioner VARCHAR(200),
    Case_Respodent VARCHAR(200),

    Case_Filing_Date DATE,
    Case_Court_Name VARCHAR(200),

    Case_Delete_Flag BOOLEAN DEFAULT FALSE,

    Case_Created_By VARCHAR(100),
    Case_Created_Date DATE,

    Case_Modified_By VARCHAR(100),
    Case_Modified_Date DATE,

    CONSTRAINT FK_Case_Type
        FOREIGN KEY (Case_Case_Type_ID)
        REFERENCES Case_Type_Master(Case_Type_ID),

    CONSTRAINT FK_Case_Court
        FOREIGN KEY (Case_Court_ID)
        REFERENCES Court_Master(Court_ID),

    CONSTRAINT FK_Case_Advocate
        FOREIGN KEY (Case_Advocate_ID)
        REFERENCES Advocate_Master(Advocate_ID)
);

CREATE TABLE IF NOT EXISTS Appointment (
    Appoint_ID INT AUTO_INCREMENT PRIMARY KEY,

    Appoint_Client_ID INT NOT NULL,
    Appoint_Case_ID INT NOT NULL,
    Appoint_Advocate_ID INT NOT NULL,

    Appoint_Date DATE NOT NULL,

    Appoint_Start_Time TIME,
    Appoint_End_Time TIME,

    Appoint_Delete_Flag BOOLEAN DEFAULT FALSE,

    Appoint_Created_By VARCHAR(100),
    Appoint_Created_Date DATE,

    Appoint_Modified_By VARCHAR(100),
    Appoint_Modified_Date DATE,

    CONSTRAINT FK_Appoint_Client
        FOREIGN KEY (Appoint_Client_ID)
        REFERENCES Client_Master(Client_ID),

    CONSTRAINT FK_Appoint_Case
        FOREIGN KEY (Appoint_Case_ID)
        REFERENCES Case_Master(Case_ID),

    CONSTRAINT FK_Appoint_Advocate
        FOREIGN KEY (Appoint_Advocate_ID)
        REFERENCES Advocate_Master(Advocate_ID)
);

CREATE TABLE IF NOT EXISTS Appointment_Remarks (
    Remark_ID INT AUTO_INCREMENT PRIMARY KEY,
    Appoint_ID INT NOT NULL,
    Remark_Text TEXT NOT NULL,
    Remark_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Remark_Created_By VARCHAR(100),
    Appoint_Date DATE,
    CONSTRAINT FK_Remark_Appoint
        FOREIGN KEY (Appoint_ID)
        REFERENCES Appointment(Appoint_ID)
        ON DELETE CASCADE
);
