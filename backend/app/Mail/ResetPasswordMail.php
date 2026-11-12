<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public User $user,
        public string $token
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Your AutoCanvas Password',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $baseUrl = rtrim(config('app.url', 'https://autocanvas.devcenterpoint.com'), '/');
        $resetUrl = "{$baseUrl}/reset-password?token=" . urlencode($this->token) . '&email=' . urlencode($this->user->email);

        return new Content(
            view: 'emails.reset_password',
            with: [
                'user' => $this->user,
                'resetUrl' => $resetUrl,
                'expireMinutes' => 60,
                'appUrl' => $baseUrl,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
