<?php

namespace App\AI\Providers;

use App\AI\Contracts\AIProviderInterface;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AnthropicProvider implements AIProviderInterface
{
    protected string $apiKey;
    protected string $defaultModel;

    public function __construct(?string $apiKey = null, string $defaultModel = 'claude-3-5-sonnet-20241022')
    {
        $this->apiKey = $apiKey ?? (string) config('services.anthropic.api_key', env('ANTHROPIC_API_KEY', ''));
        $this->defaultModel = $defaultModel;
    }

    public function getName(): string
    {
        return 'anthropic';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Generate editorial text via Anthropic Messages API.
     */
    public function generateText(string $prompt, array $options = []): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Anthropic API Key is not configured.');
        }

        $model = $options['model'] ?? $this->defaultModel;
        $url = 'https://api.anthropic.com/v1/messages';

        $payload = [
            'model' => $model,
            'max_tokens' => $options['max_tokens'] ?? 2048,
            'temperature' => $options['temperature'] ?? 0.7,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
        ];

        if (! empty($options['system_instruction'])) {
            $payload['system'] = $options['system_instruction'];
        }

        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ])->timeout(30)->post($url, $payload);

        if (! $response->successful()) {
            throw new RuntimeException("Anthropic API Error: " . $response->body(), $response->status());
        }

        $json = $response->json();
        $text = $json['content'][0]['text'] ?? '';

        $inputTokens = $json['usage']['input_tokens'] ?? (int) ceil(strlen($prompt) / 4);
        $outputTokens = $json['usage']['output_tokens'] ?? (int) ceil(strlen($text) / 4);

        return [
            'text' => $text,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'model' => $model,
        ];
    }

    /**
     * Fallback embedding generation (Anthropic has no dedicated embedding API).
     */
    public function generateEmbedding(string $text): array
    {
        // Produce a deterministic 8-dimensional normalized pseudo-vector
        $hash = md5($text);
        $vector = [];
        for ($i = 0; $i < 8; $i++) {
            $vector[] = round(hexdec(substr($hash, $i * 4, 4)) / 65535, 4);
        }

        return [
            'embedding' => $vector,
            'tokens' => (int) ceil(strlen($text) / 4),
            'model' => 'anthropic-fallback-pseudo-embed',
        ];
    }
}

