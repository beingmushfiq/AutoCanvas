<?php

namespace App\Modules\Community\Services;

use App\Modules\Community\Models\Comment;
use App\AI\Gateway\AIGateway;

class ReplySuggesterService
{
    public function __construct(protected AIGateway $aiGateway) {}

    public function suggestReply(Comment $comment): string
    {
        // Use AIGateway to generate context-aware reply
        return "Thank you for your comment, " . $comment->author_name . "!";
    }
}

