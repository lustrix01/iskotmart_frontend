<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once(INC_PATH . 'phpmailer/src/PHPMailer.php');
require_once(INC_PATH . 'phpmailer/src/Exception.php');
require_once(INC_PATH . 'phpmailer/src/SMTP.php');

function sendEmail($toEmail, $toName, $subject, $htmlBody, $altBody = '') {
    $mail = new PHPMailer(true);

    try {
        $smtpHost = getenv('MAILER_SMTP_HOST') ?: 'smtp.gmail.com';
        $smtpPort = getenv('MAILER_SMTP_PORT') ?: 587;
        $smtpSecure = getenv('MAILER_SMTP_SECURE') ?: 'tls';
        $username = getenv('MAILER_EMAIL') ?: '';
        $password = getenv('MAILER_APP_PASS') ?: '';

        if (empty($username) || empty($password)) {
            error_log('Email credentials missing in environment variables');
            return false;
        }

        $mail->isSMTP();
        $mail->Host = $smtpHost;
        $mail->SMTPAuth = true;
        $mail->Username = $username;
        $mail->Password = $password;
        $mail->SMTPSecure = $smtpSecure;
        $mail->Port = (int)$smtpPort;

        $mail->setFrom($username, getenv('MAILER_FROM_NAME') ?: 'Iskomart');
        $mail->addAddress($toEmail, $toName);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = $altBody;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log('Mail send failed: ' . $mail->ErrorInfo);
        return false;
    }
}

