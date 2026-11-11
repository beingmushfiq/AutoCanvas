<?php

namespace App\AI\Providers;

use App\AI\Contracts\AIProviderInterface;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiProvider implements AIProviderInterface
{
    protected string $apiKey;
    protected string $defaultModel;

    public function __construct(?string $apiKey = null, string $defaultModel = 'gemini-1.5-flash')
    {
        $this->apiKey = $apiKey ?? (string) config('services.google.ai_key', env('GOOGLE_AI_API_KEY', ''));
        $this->defaultModel = $defaultModel;
    }

    public function getName(): string
    {
        return 'gemini';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Generate text or structured JSON via Google Gemini REST API.
     */
    public function generateText(string $prompt, array $options = []): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Google AI API Key is not configured.');
        }

        $model = $options['model'] ?? $this->defaultModel;
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$this->apiKey}";

        $systemInstruction = $options['system_instruction'] ?? null;
        $contents = [];

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [['text' => $prompt]],
                ],
            ],
            'generationConfig' => [
                'temperature' => $options['temperature'] ?? 0.7,
                'maxOutputTokens' => $options['max_tokens'] ?? 2048,
            ],
        ];

        if (! empty($options['response_mime_type'])) {
            $payload['generationConfig']['responseMimeType'] = $options['response_mime_type'];
        }

        if ($systemInstruction) {
            $payload['systemInstruction'] = [
                'parts' => [['text' => $systemInstruction]],
            ];
        }

        $response = Http::timeout(30)->post($url, $payload);

        if (! $response->successful()) {
            throw new RuntimeException("Gemini API Error: " . $response->body(), $response->status());
        }

        $json = $response->json();
        $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';

        $inputTokens = $json['usageMetadata']['promptTokenCount'] ?? (int) ceil(strlen($prompt) / 4);
        $outputTokens = $json['usageMetadata']['candidatesTokenCount'] ?? (int) ceil(strlen($text) / 4);

        return [
            'text' => $text,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'model' => $model,
        ];
    }

    /**
     * Generate vector embedding via Google Gemini Embedding API.
     */
    public function generateEmbedding(string $text): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Google AI API Key is not configured for embeddings.');
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={$this->apiKey}";

        $response = Http::timeout(15)->post($url, [
            'model' => 'models/text-embedding-004',
            'content' => [
                'parts' => [['text' => $text]],
            ],
        ]);

        if (! $response->successful()) {
            throw new RuntimeException("Gemini Embedding Error: " . $response->body(), $response->status());
        }

        $json = $response->json();
        $values = $json['embedding']['values'] ?? [];

        return [
            'embedding' => $values,
            'tokens' => (int) ceil(strlen($text) / 4),
            'model' => 'text-embedding-004',
        ];
    }
}

