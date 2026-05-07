$body = "{}"
$response = Invoke-WebRequest -Uri 'http://localhost:5001/api/auth/fix-student' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
Write-Output $response.Content
