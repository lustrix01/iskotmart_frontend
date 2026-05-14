<?php

class User {
    
    protected $conn;
    protected $userTable = 'USERS';

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
        $query = "SELECT * FROM " . $this->userTable;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function createUser(){
        if ($this->userExists($this->email, $this->username)) {
            throw new Exception('Failed to create user: Email already registered or username already taken');
        }

        $query = "INSERT INTO " . $this->userTable . " 
            (USERNAME, EMAIL, PASSWORD_HASH, FNAME, LNAME, DOB, PHONE, GENDER, STATUS, ROLE, VERIF_STATUS, CREATED_ON)
            VALUES
            (:username, :email, :pwd, :fname, :lname, :dob, :phone, :gender, 'ACTIVE', :role, 'VERIFIED', CURDATE())";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':pwd', $this->pwd);
        $stmt->bindParam(':fname', $this->fname);
        $stmt->bindParam(':lname', $this->lname);
        $stmt->bindParam(':dob', $this->dob);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':gender', $this->gender);
        $stmt->bindParam(':role', $this->role);

        return $stmt->execute() ? $this->conn->lastInsertId() : false;
    }

    //[UTILITY] checks if username and/or email already exists in the database and is an active user
    public function userExists($email, $username){ 

        // if no email or username provided, dont bother querying
        if (!$email && !$username) {
            return false; 
        }

        $query = "SELECT * FROM " . $this->userTable . " WHERE (EMAIL = :email OR USERNAME = :username) AND STATUS = 'ACTIVE'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    

}

class Merchant extends User{

    private $merchantTable = 'MERCHANT';

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

        try {
            $this->conn->beginTransaction();

            $this->role = 'MRC';
            $merchantId = parent::createUser();
            if (!$merchantId) {
                throw new Exception('Failed to create merchant user');
            }

            $query = "INSERT INTO " . $this->merchantTable . " 
                (MERCHANT_ID, BU_EMAIL, SHOP_NAME, SHOP_DESC, ADDRESS, STUDENT_NUM, ID_IMAGE_URL)
                VALUES
                (:merchant_id, :bu_email, :shop_name, :shop_desc, :address, :student_num, :id_image_url)";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':merchant_id', $merchantId);
            $stmt->bindParam(':bu_email', $this->bu_email);
            $stmt->bindParam(':shop_name', $this->shop_name);
            $stmt->bindParam(':shop_desc', $this->shop_desc);
            $stmt->bindParam(':address', $this->address);
            $stmt->bindParam(':student_num', $this->student_num);
            $stmt->bindParam(':id_image_url', $this->id_img_url);
            $stmt->execute();

            $this->conn->commit();
            return $merchantId;
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }


}
