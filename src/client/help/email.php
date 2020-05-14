<?php

  $email = $_POST['email'];
  $name = $_POST['name'];
  $message = $_POST['message'];
  $headers = 'From: "' . $name . '" <' . $email . ">\r\n" . 'Reply-To: ' . $email;

  if (isset($email) && isset($name) && isset($message)) {
  
    $result = mail('contact@nemanode.org', 'NemaNode contact', $message, $headers);
    
    if ($result) {
      echo '{"success": true}';
    }
    else {
      echo '{"success": false}';
    }
  }
  
?>
