<?php

namespace App\Modules\Billing\Services;

use App\Modules\Billing\Models\Plan;
use App\Modules\Organization\Models\Organization;
use Symfony\Component\HttpKernel\Exception\HttpException;

class EntitlementService
{
    /**
     * Get active plan for an organization (defaults to Starter).
     */
    public function getPlan(Organization $organization): Plan
    {
        $subscription = $organization->subscription()->with('plan')->first();
        if ($subscription && $subscription->isActive() && $subscription->plan) {
            return $subscription->plan;
        }

        // Default to starter plan if no active subscription
        return Plan::where('slug', 'starter')->firstOrFail();
    }

    /**
     * Assert that the organization can create another workspace.
     */
    public function assertCanCreateWorkspace(Organization $organization): void
    {
        $plan = $this->getPlan($organization);
        $maxWorkspaces = (int) $plan->getFeature('max_workspaces', 1);
        $currentCount = $organization->workspaces()->count();

        if ($currentCount >= $maxWorkspaces) {
            throw new HttpException(
                402,
                "Your plan allows a maximum of {$maxWorkspaces} workspace(s). Please upgrade to create more."
            );
        }
    }

    /**
     * Assert that the organization can create another brand.
     */
    public function assertCanCreateBrand(Organization $organization): void
    {
        $plan = $this->getPlan($organization);
        $maxBrands = (int) $plan->getFeature('max_brands', 1);
        $currentCount = $organization->brands()->count();

        if ($currentCount >= $maxBrands) {
            throw new HttpException(
                402,
                "Your plan allows a maximum of {$maxBrands} brand(s). Please upgrade to create more."
            );
        }
    }

    /**
     * Assert that the organization can invite another member.
     */
    public function assertCanAddMember(Organization $organization): void
    {
        $plan = $this->getPlan($organization);
        $maxMembers = (int) $plan->getFeature('max_members', 2);
        $currentCount = $organization->members()->count();

        if ($currentCount >= $maxMembers) {
            throw new HttpException(
                402,
                "Your plan allows a maximum of {$maxMembers} team member(s). Please upgrade to add more."
            );
        }
    }

    /**
     * Get real-time usage summary vs plan limits.
     */
    public function getUsageSummary(Organization $organization): array
    {
        $plan = $this->getPlan($organization);

        return [
            'plan' => [
                'name' => $plan->name,
                'slug' => $plan->slug,
                'price_monthly' => $plan->price_monthly,
            ],
            'usage' => [
                'workspaces' => [
                    'current' => $organization->workspaces()->count(),
                    'max' => (int) $plan->getFeature('max_workspaces', 1),
                ],
                'members' => [
                    'current' => $organization->members()->count(),
                    'max' => (int) $plan->getFeature('max_members', 2),
                ],
                'brands' => [
                    'current' => $organization->brands()->count(),
                    'max' => (int) $plan->getFeature('max_brands', 1),
                ],
                'social_accounts' => [
                    'current' => 0, // Phase 5
                    'max' => (int) $plan->getFeature('max_social_accounts', 3),
                ],
            ],
            'features' => [
                'auto_publish_allowed' => (bool) $plan->getFeature('auto_publish_allowed', false),
                'community_inbox_enabled' => (bool) $plan->getFeature('community_inbox_enabled', true),
            ],
        ];
    }
}
