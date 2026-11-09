<?php

namespace App\AI\Contracts;

interface AIProviderInterface
{
    /**
     * Get the provider's unique identifier.
     */
    public function getName(): string;

    /**
     * Generate structured text or JSON based on prompt.
     * Returns: ['text' => string, 'input_tokens' => int, 'output_tokens' => int, 'model' => string]
     */
    public function generateText(string $prompt, array $options = []): array;

    /**
     * Generate semantic vector embeddings.
     * Returns: ['embedding' => array<float>, 'tokens' => int, 'model' => string]
     */
    public function generateEmbedding(string $text): array;
}
