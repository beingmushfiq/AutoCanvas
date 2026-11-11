<?php

namespace App\AI\Providers;

use App\AI\Contracts\AIProviderInterface;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAIProvider implements AIProviderInterface
{
    protected string $apiKey;
    protected string $defaultModel;

    public function __construct(?string $apiKey = null, string $defaultModel = 'gpt-4o-mini')
    {
        $this->apiKey = $apiKey ?? (string) config('services.openai.api_key', env('OPENAI_API_KEY', ''));
        $this->defaultModel = $defaultModel;
    }

    public function getName(): string
    {
        return 'openai';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Generate text via OpenAI Chat Completions API.
     */
    public function generateText(string $prompt, array $options = []): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('OpenAI API Key is not configured.');
        }

        $model = $options['model'] ?? $this->defaultModel;
        $url = 'https://api.openai.com/v1/chat/completions';

        $messages = [];
        if (! empty($options['system_instruction'])) {
            $messages[] = ['role' => 'system', 'content' => $options['system_instruction']];
        }
        $messages[] = ['role' => 'user', 'content' => $prompt];

        $payload = [
            'model' => $model,
            'messages' => $messages,
            'temperature' => $options['temperature'] ?? 0.7,
            'max_tokens' => $options['max_tokens'] ?? 2048,
        ];

        if (! empty($options['response_mime_type']) && $options['response_mime_type'] === 'application/json') {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $response = Http::withToken($this->apiKey)->timeout(30)->post($url, $payload);

        if (! $response->successful()) {
            throw new RuntimeException("OpenAI API Error: " . $response->body(), $response->status());
        }

        $json = $response->json();
        $text = $json['choices'][0]['message']['content'] ?? '';

        $inputTokens = $json['usage']['prompt_tokens'] ?? (int) ceil(strlen($prompt) / 4);
        $outputTokens = $json['usage']['completion_tokens'] ?? (int) ceil(strlen($text) / 4);

        return [
            'text' => $text,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'model' => $model,
        ];
    }

    /**
     * Generate vector embedding via OpenAI Embeddings API.
     */
    public function generateEmbedding(string $text): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('OpenAI API Key is not configured for embeddings.');
        }

        $url = 'https://api.openai.com/v1/embeddings';

        $response = Http::withToken($this->apiKey)->timeout(15)->post($url, [
            'model' => 'text-embedding-3-small',
            'input' => $text,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException("OpenAI Embedding Error: " . $response->body(), $response->status());
        }

        $json = $response->json();
        $vector = $json['data'][0]['embedding'] ?? [];

        return [
            'embedding' => $vector,
            'tokens' => $json['usage']['total_tokens'] ?? (int) ceil(strlen($text) / 4),
            'model' => 'text-embedding-3-small',
        ];
    }
}

