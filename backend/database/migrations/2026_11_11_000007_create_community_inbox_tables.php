<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Social Conversations (Thread Root)
        Schema::create('social_conversations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('brand_id')->index();
            $table->ulid('social_account_id')->index();
            $table->string('platform', 30)->default('facebook')->index(); // facebook, instagram, linkedin, twitter, generic
            $table->string('conversation_type', 30)->default('post_comments')->index(); // post_comments, direct_message, mention
            $table->string('platform_thread_id', 150)->index();
            $table->string('platform_post_id', 150)->nullable()->index();
            $table->string('sender_id', 150);
            $table->string('sender_name', 255);
            $table->string('sender_avatar_url', 500)->nullable();
            $table->string('status', 30)->default('open')->index(); // open, pending_review, resolved, escalated, spam
            $table->string('priority', 20)->default('normal')->index(); // low, normal, high, urgent
            $table->timestamp('last_message_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('cascade');
            $table->foreign('social_account_id')->references('id')->on('social_accounts')->onDelete('cascade');

            $table->index(['organization_id', 'status']);
            $table->index(['brand_id', 'status']);
        });

        // 2. Social Messages (Inbound & Outbound Replies)
        Schema::create('social_messages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('brand_id')->index();
            $table->ulid('social_conversation_id')->index();
            $table->string('direction', 15)->default('inbound')->index(); // inbound, outbound
            $table->string('platform_message_id', 150)->index();
            $table->string('parent_message_id', 150)->nullable();
            $table->string('sender_type', 20)->default('customer'); // customer, agent, ai_agent
            $table->string('sender_name', 255);
            $table->text('message_text');
            $table->decimal('sentiment_score', 3, 2)->default(0.00); // -1.00 to 1.00
            $table->string('intent', 30)->default('general')->index(); // inquiry, praise, complaint, lead, spam, crisis, general
            $table->text('ai_draft_reply')->nullable();
            $table->string('ai_draft_status', 30)->default('pending')->index(); // pending, accepted, rejected, auto_dispatched
            $table->boolean('is_hidden_on_platform')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('cascade');
            $table->foreign('social_conversation_id')->references('id')->on('social_conversations')->onDelete('cascade');

            $table->index(['organization_id', 'intent']);
            $table->index(['brand_id', 'direction']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_messages');
        Schema::dropIfExists('social_conversations');
    }
};

