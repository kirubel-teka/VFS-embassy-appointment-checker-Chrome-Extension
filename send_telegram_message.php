<?php
header("Content-Type: application/json");

// IMPORTANT: For production, replace '*' with your Chrome Extension ID
// You can find your extension ID at chrome://extensions when developer mode is enabled.
// Example: header("Access-Control-Allow-Origin: chrome-extension://abcdefghijklmnopqrstuvwxyz123456");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Configuration ---
// Get your bot token from @BotFather on Telegram
$botToken = '8015112098:AAEoJKLanYoCdC7ynmJEp3SD05SZxzR6PLQ'; // <<< REPLACE this with your actual Bot Token
// Get your chat ID by messaging your bot and then visiting https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
// For a group, it will be a negative number (e.g., -123456789)
$chatId = '6903226111';     // <<< REPLACE this with your actual Chat ID
// This token must be a strong, unique string and MUST match the one in background.js
$sharedSecretToken = 'asdijv2918ASDIAWFVNusjsbquq182471nabdg'; // <<< REPLACE this with your actual shared secret token

// --- Security Check ---
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$providedToken = str_replace('Bearer ', '', $authHeader);

if ($providedToken !== $sharedSecretToken) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit();
}
// --- End Security Check ---

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid JSON input."]);
    exit();
}

$subject = $data['subject'] ?? "VFS Appointment Notification";
$message = $data['message'] ?? "No message body provided.";
$recipientEmail = $data['recipient_email'] ?? "N/A";

// Construct the Telegram message
$telegramMessage = "<b>Subject:</b> " . htmlspecialchars($subject) . "\n";
$telegramMessage .= "<b>User Email:</b> " . htmlspecialchars($recipientEmail) . "\n\n";
$telegramMessage .= htmlspecialchars($message);

// Telegram Bot API URL
$telegramApiUrl = "https://api.telegram.org/bot" . $botToken . "/sendMessage";

// Prepare POST fields for Telegram API
$postFields = [
    'chat_id' => $chatId,
    'text' => $telegramMessage,
    'parse_mode' => 'HTML' // Use HTML for basic formatting (bold, italic, etc.)
];

// Use cURL for a more robust HTTP request to Telegram
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $telegramApiUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// IMPORTANT: If you encounter SSL certificate errors on your shared host,
// you *might* need to uncomment the line below. However, it's less secure.
// The ideal solution is to ensure your host's cURL has proper CA certs installed.
// curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$telegramResponse = curl_exec($ch);
$curlError = curl_error($ch);
curl_close($ch);

if ($telegramResponse === false) {
    http_response_code(500);
    error_log("CURL Error sending Telegram message: " . $curlError);
    echo json_encode(["status" => "error", "message" => "Failed to send message to Telegram: " . $curlError]);
} else {
    $telegramResult = json_decode($telegramResponse, true);
    if ($telegramResult['ok']) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Telegram message sent successfully."]);
    } else {
        http_response_code(500);
        error_log("Telegram API Error: " . ($telegramResult['description'] ?? 'Unknown error'));
        echo json_encode(["status" => "error", "message" => "Telegram API error: " . ($telegramResult['description'] ?? 'Unknown error')]);
    }
}
?>
