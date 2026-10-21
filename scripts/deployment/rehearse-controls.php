<?php

declare(strict_types=1);

// Tests real HTTP maintenance in an inert probe directory, never on the shop root.
if (PHP_SAPI !== 'cli') { exit(1); }
require __DIR__.'/HostControls.php';

use Ellena\Deployment\HostControls;

umask(0077);
$home = '/home2/ellenaco';
$token = 'ellena-release-probe-'.bin2hex(random_bytes(12));
$state = $home.'/ellena-backups/'.$token;
$probe = $home.'/public_html/'.$token;
if (! mkdir($state, 0700) || ! mkdir($probe, 0755) || ! chmod($probe, 0755)) { throw new RuntimeException('Probe setup failed'); }
file_put_contents($probe.'/index.html', 'ELLENA_RELEASE_PROBE');
chmod($probe.'/index.html', 0644);
file_put_contents($probe.'/.htaccess', "DirectoryIndex index.html\n");
chmod($probe.'/.htaccess', 0644);
$p = proc_open(['crontab', '-l'], [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
$cron = stream_get_contents($pipes[1]); fclose($pipes[1]);
$error = stream_get_contents($pipes[2]); fclose($pipes[2]);
if (proc_close($p) !== 0) { throw new RuntimeException('Cannot read cron'); }
$originalCron = $cron;
// Both closures must see the in-memory cron updates; no crontab write is performed.
$controls = new HostControls($probe.'/.htaccess', $state, $home.'/ellena', static function () use (&$cron): string { return $cron; }, static function (string $value) use (&$cron): void { $cron = $value; });
$controls->prepare();
$check = static function (string $domain, int $expected, string $marker) use ($token): void {
    for ($attempt = 0; $attempt < 6; $attempt++) {
        $curl = curl_init('https://'.$domain.'/'.$token.'/?verify='.bin2hex(random_bytes(6)));
        curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5, CURLOPT_FOLLOWLOCATION => false, CURLOPT_HTTPHEADER => ['Cache-Control: no-cache']]);
        $body = curl_exec($curl);
        $code = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);
        if ($code === $expected && is_string($body) && str_contains($body, $marker)) {
            echo $domain.' HTTP '.$code.' VERIFIED'.PHP_EOL;
            return;
        }
        sleep(2);
    }
    throw new RuntimeException('HTTP probe failed for '.$domain.'; expected '.$expected.', received '.$code);
};
try {
    $controls->closeGate();
    $controls->assertClosed();
    $controls->stopWriters();
    $controls->assertWritersStopped();
    foreach (['ellenacosms.com', 'www.ellenacosms.com', 'admin.ellenacosms.com'] as $domain) { $check($domain, 503, 'shop is being updated'); }
    // Some hosts compare htaccess timestamps at whole-second resolution.
    sleep(2);
    $controls->openGate();
    $controls->startWriters();
    if ($cron !== $originalCron) { throw new RuntimeException('Cron simulation did not restore exactly'); }
    foreach (['ellenacosms.com', 'www.ellenacosms.com', 'admin.ellenacosms.com'] as $domain) { $check($domain, 200, 'ELLENA_RELEASE_PROBE'); }
    $report = ['result' => 'PASS', 'gate' => '503 then 200 on all three domains', 'cron' => 'simulated pause and exact restore of real cron text; live cron unchanged', 'shop_root_unchanged' => true];
    file_put_contents($state.'/report.json', json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    echo 'HOST_CONTROLS_REHEARSAL_PASS'.PHP_EOL.'REPORT='.$state.'/report.json'.PHP_EOL;
} finally {
    // Move only our unique inert probe out of public_html; retain evidence privately.
    if (is_dir($probe) && ! is_link($probe)) {
        if (! rename($probe, $state.'/probe')) { throw new RuntimeException('Cannot retire probe directory'); }
    }
}
