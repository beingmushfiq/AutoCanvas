<?php

namespace App\AI\Gateway;

use App\AI\Contracts\AIProviderInterface;
use App\AI\Models\AiUsageRecord;
use App\AI\Providers\AnthropicProvider;
use App\AI\Providers\DeterministicMockProvider;
use App\AI\Providers\GeminiProvider;
use App\AI\Providers\OpenAIProvider;
use App\AI\Services\AiCostCalculator;
use App\Modules\ControlPlane\Services\SystemSettingsService;
use Illuminate\Support\Facades\Log;
use Throwable;

class AIGateway
{
    /**
     * Registered provider instances.
     *
     * @var array<string, AIProviderInterface>
     */
    protected array $providers = [];

    /**
     * Explicit override provider.
     */
    protected ?AIProviderInterface $overrideProvider = null;

    public function __construct(
        ?AIProviderInterface $overrideProvider = null,
        protected ?SystemSettingsService $settingsService = null
    ) {
        $this->overrideProvider = $overrideProvider;
        $this->registerDefaultProviders();
    }

    /**
     * Register available provider adapters.
     */
    protected function registerDefaultProviders(): void
    {
        $this->providers['gemini'] = new GeminiProvider();
        $this->providers['anthropic'] = new AnthropicProvider();
        $this->providers['openai'] = new OpenAIProvider();
        $this->providers['mock'] = new DeterministicMockProvider();
    }

    /**
     * Dynamically override active provider.
     */
    public function setProvider(AIProviderInterface $provider): self
    {
        $this->overrideProvider = $provider;

        return $this;
    }

    /**
     * Get a registered provider by identifier.
     */
    public function getProvider(string $name): ?AIProviderInterface
    {
        return $this->providers[strtolower($name)] ?? null;
    }

    /**
     * Generate text or structured JSON with dynamic routing, fallback cascade, and token cost accounting.
     */
    public function generateText(string $prompt, array $options = []): array
    {
        $taskType = $options['task_type'] ?? 'general';

        if ($this->overrideProvider) {
            $chain = [$this->overrideProvider];
        } else {
            $chain = $this->buildFallbackChain($taskType);
        }

        $lastException = null;
        $result = null;
        $usedProvider = null;

        foreach ($chain as $provider) {
            try {
                $result = $provider->generateText($prompt, $options);
                $usedProvider = $provider;
                break;
            } catch (Throwable $e) {
                $lastException = $e;
                Log::warning("AI Gateway provider '{$provider->getName()}' failed for task '{$taskType}': {$e->getMessage()}. Attempting fallback.");
            }
        }

        // If all providers in chain failed, fallback to DeterministicMockProvider as safety net
        if (! $result) {
            $mock = $this->providers['mock'];
            $result = $mock->generateText($prompt, $options);
            $usedProvider = $mock;
        }

        // Record AI Usage & Token Accounting
        $orgId = $options['organization_id'] ?? (app()->has('current_organization_id') ? app('current_organization_id') : null);
        $brandId = $options['brand_id'] ?? null;
        $userId = auth()->check() ? auth()->id() : null;

        if ($orgId) {
            $cost = AiCostCalculator::calculate(
                $result['model'],
                $result['input_tokens'],
                $result['output_tokens']
            );

            AiUsageRecord::create([
                'organization_id' => $orgId,
                'workspace_id' => app()->has('current_workspace_id') ? app('current_workspace_id') : null,
                'brand_id' => $brandId,
                'user_id' => $userId,
                'provider' => $usedProvider ? $usedProvider->getName() : 'unknown',
                'model' => $result['model'],
                'task_type' => $taskType,
                'input_tokens' => $result['input_tokens'],
                'output_tokens' => $result['output_tokens'],
                'estimated_cost_usd' => $cost,
                'created_at' => now(),
            ]);
        }

        return $result;
    }

    /**
     * Generate semantic vector embeddings.
     */
    public function generateEmbedding(string $text, array $options = []): array
    {
        if ($this->overrideProvider) {
            return $this->overrideProvider->generateEmbedding($text);
        }

        // Try Gemini embedding -> OpenAI embedding -> Mock embedding
        $embeddingChain = [
            $this->providers['gemini'],
            $this->providers['openai'],
            $this->providers['mock'],
        ];

        foreach ($embeddingChain as $provider) {
            try {
                return $provider->generateEmbedding($text);
            } catch (Throwable $e) {
                Log::warning("AI Gateway embedding provider '{$provider->getName()}' failed: {$e->getMessage()}. Trying fallback.");
            }
        }

        return $this->providers['mock']->generateEmbedding($text);
    }

    /**
     * Build an ordered fallback cascade of providers based on task type and configuration.
     *
     * @return array<AIProviderInterface>
     */
    protected function buildFallbackChain(string $taskType): array
    {
        $preferredName = $this->getPreferredProviderForTask($taskType);
        $preferred = $this->getProvider($preferredName);

        $chain = [];
        if ($preferred) {
            $chain[] = $preferred;
        }

        // Add standard fallback order
        foreach (['gemini', 'anthropic', 'openai', 'mock'] as $fallbackName) {
            $p = $this->getProvider($fallbackName);
            if ($p && ! in_array($p, $chain, true)) {
                $chain[] = $p;
            }
        }

        return $chain;
    }

    /**
     * Determine preferred provider name for a given task.
     */
    protected function getPreferredProviderForTask(string $taskType): string
    {
        // Check runtime system settings if available
        if ($this->settingsService) {
            $configuredDefault = (string) $this->settingsService->get('default_ai_provider', 'gemini');
            $customRouting = (array) $this->settingsService->get('ai_task_routing', []);
            if (! empty($customRouting[$taskType])) {
                return $customRouting[$taskType];
            }
            if (! empty($configuredDefault)) {
                return $configuredDefault;
            }
        }

        // Built-in intelligent task routing defaults
        return match ($taskType) {
            'research_summarization', 'reply_suggester' => 'gemini',
            'creative_copywriting' => 'anthropic',
            'qa_risk_evaluation' => 'openai',
            'brand_discovery' => 'gemini',
            default => 'gemini',
        };
    }
}
