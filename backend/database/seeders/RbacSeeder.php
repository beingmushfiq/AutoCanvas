<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // System Permissions (Control Plane)
            ['name' => 'system.metrics.view', 'display_name' => 'View System Telemetry', 'category' => 'system', 'description' => 'View high-level MRR, active workers, queue depth, and global AI spend.'],
            ['name' => 'system.organizations.manage', 'display_name' => 'Manage Organizations', 'category' => 'system', 'description' => 'View, inspect, suspend, or adjust quotas for any tenant organization.'],
            ['name' => 'system.billing.verify', 'display_name' => 'Verify Local Payments', 'category' => 'system', 'description' => 'Approve or reject offline bKash, Nagad, and bank wire transactions.'],
            ['name' => 'system.ai.configure', 'display_name' => 'Configure AI Gateway', 'category' => 'system', 'description' => 'Adjust AI model routing, provider API keys, and global budget caps.'],
            ['name' => 'system.emergency.circuit_breaker', 'display_name' => 'Emergency Circuit Breaker', 'category' => 'system', 'description' => 'Activate or deactivate platform-wide automation freezes.'],
            ['name' => 'system.cms.manage', 'display_name' => 'Manage CMS Content', 'category' => 'system', 'description' => 'Publish and manage marketing pages, changelog, and in-app banners.'],

            // Organization Permissions
            ['name' => 'organization.profile.update', 'display_name' => 'Update Organization Profile', 'category' => 'organization', 'description' => 'Update organization name, billing email, and timezone.'],
            ['name' => 'organization.members.invite', 'display_name' => 'Invite Organization Members', 'category' => 'organization', 'description' => 'Invite new team members to the organization.'],
            ['name' => 'organization.members.roles', 'display_name' => 'Manage Member Roles', 'category' => 'organization', 'description' => 'Update roles or remove existing team members.'],
            ['name' => 'organization.billing.manage', 'display_name' => 'Manage Billing & Subscription', 'category' => 'organization', 'description' => 'Upgrade/downgrade subscription and submit payment proofs.'],
            ['name' => 'organization.audit.view', 'display_name' => 'View Organization Audit Logs', 'category' => 'organization', 'description' => 'Inspect tenant audit logs for compliance and accountability.'],

            // Brand Permissions
            ['name' => 'brand.create', 'display_name' => 'Create Brands', 'category' => 'brand', 'description' => 'Create new brand profiles within workspaces.'],
            ['name' => 'brand.profile.edit', 'display_name' => 'Edit Brand Profile', 'category' => 'brand', 'description' => 'Modify brand positioning, target personas, and bio.'],
            ['name' => 'brand.voice.edit', 'display_name' => 'Edit Brand Voice', 'category' => 'brand', 'description' => 'Update tone descriptors, sample copy, and vocabulary constraints.'],
            ['name' => 'brand.knowledge.ingest', 'display_name' => 'Ingest Knowledge Base Sources', 'category' => 'brand', 'description' => 'Upload documents or websites for brand knowledge chunking.'],
            ['name' => 'brand.discovery.run', 'display_name' => 'Run AI Brand Discovery', 'category' => 'brand', 'description' => 'Execute automated website brand discovery audits.'],
            ['name' => 'brand.delete', 'display_name' => 'Delete Brands', 'category' => 'brand', 'description' => 'Permanently delete brand profiles and associated history.'],

            // Content Strategy & Production Permissions
            ['name' => 'content.pillar.manage', 'display_name' => 'Manage Content Pillars', 'category' => 'content', 'description' => 'Create and modify content pillars and strategy ratios.'],
            ['name' => 'content.campaign.manage', 'display_name' => 'Manage Campaigns', 'category' => 'content', 'description' => 'Create and modify marketing campaigns.'],
            ['name' => 'content.draft.create', 'display_name' => 'Create Content Drafts', 'category' => 'content', 'description' => 'Create draft posts manually or via research bridge.'],
            ['name' => 'content.ai.generate', 'display_name' => 'Generate AI Content', 'category' => 'content', 'description' => 'Invoke AI copy generation and creative layout proposals.'],
            ['name' => 'content.review.submit', 'display_name' => 'Submit Content for Review', 'category' => 'content', 'description' => 'Transition draft posts into pending approval status.'],
            ['name' => 'content.approve', 'display_name' => 'Approve Content', 'category' => 'content', 'description' => 'Approve reviewed posts for scheduling and publishing.'],
            ['name' => 'content.delete', 'display_name' => 'Delete Content', 'category' => 'content', 'description' => 'Delete content drafts and variants.'],

            // Publishing & Social Connectors
            ['name' => 'publishing.social.connect', 'display_name' => 'Connect Social Channels', 'category' => 'publishing', 'description' => 'Authenticate Facebook, Instagram, or LinkedIn accounts.'],
            ['name' => 'publishing.schedule', 'display_name' => 'Schedule Posts', 'category' => 'publishing', 'description' => 'Assign scheduled publishing slots on the calendar.'],
            ['name' => 'publishing.publish_now', 'display_name' => 'Immediate Social Publishing', 'category' => 'publishing', 'description' => 'Trigger immediate social post dispatch.'],
            ['name' => 'publishing.cancel', 'display_name' => 'Cancel Scheduled Posts', 'category' => 'publishing', 'description' => 'Cancel or un-schedule queued social posts.'],
            ['name' => 'publishing.calendar.view', 'display_name' => 'View Publishing Calendar', 'category' => 'publishing', 'description' => 'View scheduled and past posts on the publishing calendar.'],

            // Community Management
            ['name' => 'community.inbox.view', 'display_name' => 'View Unified Community Inbox', 'category' => 'community', 'description' => 'Read incoming social comments and messages.'],
            ['name' => 'community.reply.post', 'display_name' => 'Post Community Replies', 'category' => 'community', 'description' => 'Send replies to social network comments.'],
            ['name' => 'community.moderation.manage', 'display_name' => 'Moderate Community Comments', 'category' => 'community', 'description' => 'Hide, delete, or flag inappropriate comments.'],

            // Analytics
            ['name' => 'analytics.overview.view', 'display_name' => 'View Analytics Telemetry', 'category' => 'analytics', 'description' => 'Inspect performance charts, engagement metrics, and reach.'],
            ['name' => 'analytics.reports.export', 'display_name' => 'Export Analytics Reports', 'category' => 'analytics', 'description' => 'Export CSV and PDF reports of brand performance.'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(
                ['name' => $perm['name']],
                [
                    'display_name' => $perm['display_name'],
                    'category' => $perm['category'],
                    'description' => $perm['description'],
                ]
            );
        }

        // Roles Definition
        $roles = [
            [
                'name' => 'superadmin',
                'display_name' => 'Super Administrator',
                'scope' => 'system',
                'is_system_preset' => true,
                'permission_categories' => ['system'],
            ],
            [
                'name' => 'platform_support',
                'display_name' => 'Platform Support Agent',
                'scope' => 'system',
                'is_system_preset' => true,
                'permissions' => ['system.metrics.view', 'system.organizations.manage', 'system.billing.verify'],
            ],
            [
                'name' => 'org_owner',
                'display_name' => 'Organization Owner',
                'scope' => 'organization',
                'is_system_preset' => true,
                'permission_categories' => ['organization', 'brand', 'content', 'publishing', 'community', 'analytics'],
            ],
            [
                'name' => 'org_admin',
                'display_name' => 'Organization Administrator',
                'scope' => 'organization',
                'is_system_preset' => true,
                'permissions' => [
                    'organization.profile.update',
                    'organization.members.invite',
                    'organization.members.roles',
                    'organization.audit.view',
                    'brand.create',
                    'brand.profile.edit',
                    'brand.voice.edit',
                    'brand.knowledge.ingest',
                    'brand.discovery.run',
                    'content.pillar.manage',
                    'content.campaign.manage',
                    'content.draft.create',
                    'content.ai.generate',
                    'content.review.submit',
                    'content.approve',
                    'content.delete',
                    'publishing.social.connect',
                    'publishing.schedule',
                    'publishing.publish_now',
                    'publishing.cancel',
                    'publishing.calendar.view',
                    'community.inbox.view',
                    'community.reply.post',
                    'community.moderation.manage',
                    'analytics.overview.view',
                    'analytics.reports.export',
                ],
            ],
            [
                'name' => 'org_editor',
                'display_name' => 'Content Editor & Designer',
                'scope' => 'organization',
                'is_system_preset' => true,
                'permissions' => [
                    'brand.profile.edit',
                    'brand.knowledge.ingest',
                    'content.pillar.manage',
                    'content.campaign.manage',
                    'content.draft.create',
                    'content.ai.generate',
                    'content.review.submit',
                    'publishing.calendar.view',
                    'community.inbox.view',
                    'community.reply.post',
                    'analytics.overview.view',
                ],
            ],
            [
                'name' => 'org_viewer',
                'display_name' => 'Auditor & Viewer',
                'scope' => 'organization',
                'is_system_preset' => true,
                'permissions' => [
                    'publishing.calendar.view',
                    'analytics.overview.view',
                ],
            ],
        ];

        foreach ($roles as $roleData) {
            $role = Role::firstOrCreate(
                ['name' => $roleData['name']],
                [
                    'display_name' => $roleData['display_name'],
                    'scope' => $roleData['scope'],
                    'is_system_preset' => $roleData['is_system_preset'],
                ]
            );

            // Attach permissions
            if (isset($roleData['permission_categories'])) {
                $categoryPerms = Permission::whereIn('category', $roleData['permission_categories'])->get();
                $role->permissions()->syncWithoutDetaching($categoryPerms->pluck('id'));
            } elseif (isset($roleData['permissions'])) {
                $permIds = Permission::whereIn('name', $roleData['permissions'])->pluck('id');
                $role->permissions()->syncWithoutDetaching($permIds);
            }
        }
    }
}

