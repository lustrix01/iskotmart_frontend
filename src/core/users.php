<?php

class User {
    
    private $conn;
    private $table = 'users';

    public $id;
    public $username;
    public $email;
    public $pwd;
    public $fname;
    public $lname;
    public $dob;
    public $phone;
    public $gender;
    public $status;
    public $avatar_url;
    public $role;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getUsers(){ // get all users [test function]
        $query = "SELECT * FROM " . $this->table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function createUSer();

    //[UTILITY] checks if username and/or email already exists in the database and is an active user
    public function userExists($email, $username){ 

        // if no email or username provided, dont bother querying
        if (!$email && !$username) {
            return false; 
        }

        $query = "SELECT * FROM " . $this->table . " WHERE (EMAIL = :email OR USERNAME = :username) AND STATUS = 'ACTIVE'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    

}

class Merchant extends User{

    private $table = 'merchants';

    public $bu_email;
    public $shop_name;
    public $shop_desc;
    public $address;
    public $student_num;
    public $id_img_url;

    public function __construct($db) {
        parent::__construct($db);  // passes $db to parent
    }

    //creates merchant
    public function createUser(){

        if ($this->userExists($this->email, $this->username)) {
            throw new Exception('Failed to create merchant: Email already registered or username already taken');
        }

        $query = "INSERT INTO USERS (USERNAME, EMAIL, PASSWORD_HASH, FNAME, LNAME, DOB, PHONE, GENDER, STATUS, ROLE, CREATED_ON) 
        VALUES (:username,
        :email,
        :pwd,
        :fname,
        :lname,
        :dob,
        :phone,
        :gender,
        'ACTIVE',
        'MRC',
        NOW());
        
        INSERT INTO " . $this->table . " (BU_EMAIL, SHOP_NAME, ADDRESS, STUDENT_NUM, ID_IMG_URL) 
        VALUES 
        (LAST_INSERT_ID(), 
        :shop_name, 
        :address, 
        :student_num, 
        :id_img_url)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':pwd', $this->pwd);
        $stmt->bindParam(':fname', $this->fname);
        $stmt->bindParam(':lname', $this->lname);
        $stmt->bindParam(':dob', $this->dob);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':gender', $this->gender);
        $stmt->bindParam(':shop_name', $this->shop_name);
        $stmt->bindParam(':address', $this->address);
        $stmt->bindParam(':student_num', $this->student_num);
        $stmt->bindParam(':id_img_url', $this->id_img_url);

        if($stmt->execute()){
            return true;
        }

        return false;
    }


}