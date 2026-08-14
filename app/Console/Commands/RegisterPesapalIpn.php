<?php

namespace App\Console\Commands;

use App\Services\Payments\PesapalClient;
use Illuminate\Console\Command;
use Throwable;

class RegisterPesapalIpn extends Command
{
    protected $signature = 'pesapal:register-ipn {--url= : Public HTTPS IPN URL}';

    protected $description = 'Register the Ellena Pesapal API 3.0 IPN URL';

    public function handle(PesapalClient $pesapal): int
    {
        $url = trim((string) ($this->option('url') ?: config('services.pesapal.ipn_url')));

        if (! filter_var($url, FILTER_VALIDATE_URL) || parse_url($url, PHP_URL_SCHEME) !== 'https') {
            $this->error('Provide a publicly accessible HTTPS IPN URL.');

            return self::FAILURE;
        }

        try {
            $ipnId = $pesapal->registerIpn($url);
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info('Pesapal IPN registered successfully.');
        $this->line('Add this value to your environment file:');
        $this->newLine();
        $this->line('PESAPAL_IPN_ID='.$ipnId);

        return self::SUCCESS;
    }
}
