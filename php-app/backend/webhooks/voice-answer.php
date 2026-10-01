<?php
/**
 * Naga AI Assistant (Arya) — Vobiz Voice Answer Webhook
 * Returns valid Vobiz XML (<Response><Speak>...</Speak><Record ... /></Response>)
 * when Naga answers an outbound briefing call.
 */

header('Content-Type: text/xml; charset=UTF-8');

$summary = $_GET['summary'] ?? ($_POST['summary'] ?? '');
if (empty($summary)) {
    $summary = "You have an urgent client communication pending in your Arya AI dashboard.";
}
$callId = $_GET['call_id'] ?? ($_POST['CallUUID'] ?? '');

// Clean summary for safe XML output
$cleanSummary = htmlspecialchars($summary, ENT_QUOTES | ENT_XML1, 'UTF-8');
$recordAction = "https://ai.tenkasidreams.com/backend/webhooks/voice-record.php" . ($callId ? "?call_id=" . urlencode($callId) : "");

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<Response>
    <Speak voice="WOMAN" language="en-IN">Vanakkam Naga. This is Arya. <?php echo $cleanSummary; ?>. Please speak your instruction for the client after the beep, and press hash when done.</Speak>
    <Record action="<?php echo htmlspecialchars($recordAction, ENT_QUOTES | ENT_XML1); ?>" method="POST" maxLength="30" finishOnKey="#" playBeep="true" />
</Response>
