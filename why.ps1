# why.ps1
# One question, asked plainly: when the site redirects, where does it
# send you, and what did Next think the address was?
#
#   powershell -ExecutionPolicy Bypass -File .\why.ps1

$ErrorActionPreference = "Continue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$base = "https://expatpreneur.vercel.app"

$paths = @('/', '/membership', '/villages', '/villages/dubai', '/events',
           '/businesses', '/learning', '/members', '/media', '/me', '/more')

"{0,-22} {1,-8} {2,-34} {3}" -f 'Address', 'Status', 'Sends you to', 'Next matched'
"-" * 100

foreach ($p in $paths) {
  foreach ($suffix in @('', '?recon=1')) {
    $url = "$base$p$suffix"
    $status = 0; $loc = ''; $matched = ''
    try {
      $r = Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30
      $status = [int]$r.StatusCode
      $matched = [string]$r.Headers['x-matched-path']
    } catch {
      $resp = $_.Exception.Response
      if ($resp) {
        $status = [int]$resp.StatusCode
        $loc = [string]$resp.Headers['Location']
        $matched = [string]$resp.Headers['x-matched-path']
      }
    }
    "{0,-22} {1,-8} {2,-34} {3}" -f "$p$suffix", $status, $loc, $matched
  }
}