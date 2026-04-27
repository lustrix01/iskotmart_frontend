<?php

# DEFINES ALL NEEDED DIRECTORIES AND LOADS ALL CORE CLASSES AND DB CONFIG
# this file should be included in all files that need to access the database or core classes, so that we don't have to include them separately in each file

    //defines DS as directory separator...essentially \ on windows and / on linux, so that the code can be used on both systems without modification
    defined('DS') ? null : define('DS', DIRECTORY_SEPARATOR);

    //resolve the app root where api/, core/, and include/ directories live
    defined('ROOT') ? null : define('ROOT', dirname(__DIR__) . DS);
    
    //defines include and core paths from the resolved root
    defined('INC_PATH') ? null : define('INC_PATH', ROOT . 'src' . DS . 'include' . DS);
    defined('CORE_PATH') ? null : define('CORE_PATH', ROOT . 'src' . DS . 'core' . DS);

    //load db config 
    require_once(INC_PATH . 'config.php');

    //core classes 
    require_once(CORE_PATH . 'users.php');

?>
