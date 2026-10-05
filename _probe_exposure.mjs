const base = 'https://swiftdevelopers.kesug.com';
const paths = [
  '/application/config/database.local.php',
  '/application/config/enc_key.php',
];

for (const p of paths) {
  const r = await fetch(base + p);
  const t = await r.text();
  const imports = [...t.matchAll(/<script[^>]*\ssrc=['"]([^'"]+)['"]/gi)].map(m => m[1]);
  console.log('=== ' + p + '  status=' + r.status + '  bytes=' + t.length);
  console.log('    looksLikeJSChallenge=' + /toNumbers|toHex/.test(t));
  console.log('    isRawPHPsource=' + /<\?php[\s\S]*\$db_|\$config\[/.test(t));
  console.log('    externalScripts=' + JSON.stringify(imports));
  console.log('');
}