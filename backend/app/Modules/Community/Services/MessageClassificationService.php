<?php

namespace App\Modules\Community\Services;

use App\AI\Gateway\AIGateway;
use App\Modules\Brand\Models\Brand;

class MessageClassificationService
{
    public function __construct(
        protected ?AIGateway $aiGateway = null
    ) {
        $this->aiGateway = $aiGateway ?? app(AIGateway::class);
    }

    /**
     * Classify an incoming message into intent, sentiment score, and priority.
     */
    public function classifyMessage(Brand $brand, string $text): array
    {
        $cleanText = strtolower(trim($text));

        // 1. Spam & Phishing Shield
        if ($this->evaluateSpam($brand, $cleanText)) {
            return [
                'intent' => 'spam',
                'sentiment_score' => -0.60,
                'priority' => 'low',
                'is_spam' => true,
            ];
        }

        // 2. High-Severity Crisis Detection
        $crisisKeywords = ['lawsuit', 'lawyer', 'attorney', 'sue you', 'fraud', 'illegal', 'scam artists', 'report to authorities', 'data breach'];
        foreach ($crisisKeywords as $keyword) {
            if (str_contains($cleanText, $keyword)) {
                return [
                    'intent' => 'crisis',
                    'sentiment_score' => -0.95,
                    'priority' => 'urgent',
                    'is_spam' => false,
                ];
            }
        }

        // 3. Purchase Intent & Sales Lead Detection
        $leadKeywords = ['pricing', 'quote', 'enterprise plan', 'schedule demo', 'book demo', 'how much does it cost', 'sales contact', 'custom contract'];
        foreach ($leadKeywords as $keyword) {
            if (str_contains($cleanText, $keyword)) {
                return [
                    'intent' => 'lead',
                    'sentiment_score' => 0.40,
                    'priority' => 'high',
                    'is_spam' => false,
                ];
            }
        }

        // 4. Complaint & Technical Support Friction
        $complaintKeywords = ['broken', 'bug', 'error', 'fails', 'not working', 'refund', 'terrible service', 'cannot login', 'charged twice', 'cancelled my subscription'];
        foreach ($complaintKeywords as $keyword) {
            if (str_contains($cleanText, $keyword)) {
                return [
                    'intent' => 'complaint',
                    'sentiment_score' => -0.70,
                    'priority' => 'high',
                    'is_spam' => false,
                ];
            }
        }

        // 5. Praise & Positive Sentiment
        $praiseKeywords = ['love this', 'awesome', 'great work', 'great', 'huge fan', 'congratulations', 'best tool', 'fantastic', 'kudos', 'superb', 'excellent', 'amazing'];
        foreach ($praiseKeywords as $keyword) {
            if (str_contains($cleanText, $keyword)) {
                return [
                    'intent' => 'praise',
                    'sentiment_score' => 0.85,
                    'priority' => 'normal',
                    'is_spam' => false,
                ];
            }
        }

        // 6. General Questions & Inquiries
        if (str_contains($cleanText, '?') || str_contains($cleanText, 'how to') || str_contains($cleanText, 'can i')) {
            return [
                'intent' => 'inquiry',
                'sentiment_score' => 0.10,
                'priority' => 'normal',
                'is_spam' => false,
            ];
        }

        // Default neutral classification
        return [
            'intent' => 'general',
            'sentiment_score' => 0.05,
            'priority' => 'normal',
            'is_spam' => false,
        ];
    }

    /**
     * Check if content contains spam patterns or prohibited brand terms.
     */
    public function evaluateSpam(Brand $brand, string $cleanText): bool
    {
        $spamPatterns = [
            'crypto',
            'airdrop',
            'usdt',
            'bitcoin',
            'bonus',
            'pump 100x',
            'telegram',
            't.me',
            'earn crypto',
            'earn money',
            'free tokens',
            'free bonus',
            'dm me to invest',
            'whatsapp',
            'telegram channel',
            'airdrop alert',
            '100x',
            'make money fast',
            'click link in bio',
            'forex trading',
        ];

        foreach ($spamPatterns as $pattern) {
            if (str_contains($cleanText, $pattern)) {
                return true;
            }
        }

        // Also check brand prohibited subjects
        $prohibited = $brand->profile?->prohibited_subjects ?? [];
        foreach ($prohibited as $term) {
            if (!empty($term) && str_contains($cleanText, strtolower($term))) {
                return true;
            }
        }

        return false;
    }
}
