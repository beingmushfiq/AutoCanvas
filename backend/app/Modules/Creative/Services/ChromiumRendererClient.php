<?php

namespace App\Modules\Creative\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChromiumRendererClient
{
    protected string $baseUrl;

    public function __construct(?string $baseUrl = null)
    {
        $this->baseUrl = rtrim($baseUrl ?? env('RENDERER_URL', 'http://127.0.0.1:3001'), '/');
    }

    /**
     * Check if the Node.js / Playwright rendering daemon is running and responsive.
     */
    public function isHealthy(): bool
    {
        try {
            $response = Http::timeout(2)->get("{$this->baseUrl}/health");
            return $response->successful() && $response->json('status') === 'ok';
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Dispatch creative document to Playwright Chromium daemon for crisp retina PNG rendering.
     *
     * @return string|null Raw image bytes on success, or null on error
     */
    public function render(array $docPayload): ?string
    {
        try {
            $response = Http::timeout(10)->post("{$this->baseUrl}/render", $docPayload);

            if ($response->successful()) {
                return $response->body();
            }

            Log::warning("[ChromiumRendererClient] Rendering error: " . $response->body());
            return null;
        } catch (\Throwable $e) {
            Log::info("[ChromiumRendererClient] Daemon offline or unreachable: " . $e->getMessage());
            return null;
        }
    }
}

