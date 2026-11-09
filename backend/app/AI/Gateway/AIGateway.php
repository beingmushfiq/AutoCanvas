<?php

namespace App\AI\Gateway;

use App\AI\Contracts\AIProviderInterface;
use App\AI\Models\AiUsageRecord;
use App\AI\Providers\DeterministicMockProvider;

class AIGateway
{
    protected AIProviderInterface $provider;

    public function __construct(?AIProviderInterface $provider = null)
    {
        // For Phase 2, default to DeterministicMockProvider unless explicitly configured
        $this->provider = $provider ?? new DeterministicMockProvider;
    }

    /**
     * Set active provider dynamically.
     */
    public function setProvider(AIProviderInterface $provider): self
    {
        $this->provider = $provider;

        return $this;
    }

    /**
     * Generate text or structured JSON and record token accounting.
     */
    public function generateText(string $prompt, array $options = []): array
    {
        $taskType = $options['task_type'] ?? 'general';
        $result = $this->provider->generateText($prompt, $options);

        // Record AI Usage
        $orgId = $options['organization_id'] ?? (app()->has('current_organization_id') ? app('current_organization_id') : null);
        $brandId = $options['brand_id'] ?? null;
        $userId = auth()->check() ? auth()->id() : null;

        if ($orgId) {
            $inputCost = ($result['input_tokens'] / 1_000_000) * 3.00; // standard estimate
            $outputCost = ($result['output_tokens'] / 1_000_000) * 15.00;
            $totalCost = round($inputCost + $outputCost, 6);

            AiUsageRecord::create([
                'organization_id' => $orgId,
                'workspace_id' => app()->has('current_workspace_id') ? app('current_workspace_id') : null,
                'brand_id' => $brandId,
                'user_id' => $userId,
                'provider' => $this->provider->getName(),
                'model' => $result['model'],
                'task_type' => $taskType,
                'input_tokens' => $result['input_tokens'],
                'output_tokens' => $result['output_tokens'],
                'estimated_cost_usd' => $totalCost,
                'created_at' => now(),
            ]);
        }

        return $result;
    }

    /**
     * Generate embeddings for semantic search.
     */
    public function generateEmbedding(string $text, array $options = []): array
    {
        return $this->provider->generateEmbedding($text);
    }
}
