<?php

namespace App\Modules\ContentProduction\Services;

use App\Models\User;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\Organization\Services\AuditLogger;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ContentApprovalService
{
    /**
     * Submit draft post for review.
     */
    public function submitForReview(ContentItem $item, User $user): ContentItem
    {
        if (! in_array($item->status, ['draft', 'rejected'])) {
            throw new HttpException(422, 'Content item must be in draft or rejected status to submit for review.');
        }

        $item->update([
            'status' => 'review',
        ]);

        AuditLogger::log('content.submitted_review', $item, ['status' => 'draft'], ['status' => 'review'], $item->organization_id);

        return $item;
    }

    /**
     * Approve content item.
     */
    public function approve(ContentItem $item, User $user): ContentItem
    {
        $item->update([
            'status' => 'approved',
            'reviewed_by_user_id' => $user->id,
            'reviewed_at' => now(),
            'review_feedback' => null,
        ]);

        AuditLogger::log('content.approved', $item, null, [
            'approved_by' => $user->email,
            'status' => 'approved',
        ], $item->organization_id);

        return $item;
    }

    /**
     * Reject content item with feedback.
     */
    public function reject(ContentItem $item, User $user, string $feedback): ContentItem
    {
        $item->update([
            'status' => 'rejected',
            'review_feedback' => $feedback,
            'reviewed_by_user_id' => $user->id,
            'reviewed_at' => now(),
        ]);

        AuditLogger::log('content.rejected', $item, null, [
            'rejected_by' => $user->email,
            'feedback' => $feedback,
            'status' => 'rejected',
        ], $item->organization_id);

        return $item;
    }
}
