<?php

namespace App\Modules\Auth\Services;

use App\Mail\ResetPasswordMail;
use App\Models\User;
use App\Modules\Organization\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetService
{
    /**
     * Send password reset recovery email with secure token.
     * Always returns success message to avoid email enumeration.
     */
    public function sendResetLink(string $email): array
    {
        $normalizedEmail = strtolower(trim($email));
        $user = User::where('email', $normalizedEmail)->first();

        if ($user) {
            $rawToken = Str::random(64);

            // Store hashed token in password_reset_tokens
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $normalizedEmail],
                [
                    'token' => Hash::make($rawToken),
                    'created_at' => now(),
                ]
            );

            // Dispatch transactional recovery email via verified SMTP
            Mail::to($user->email)->queue(new ResetPasswordMail($user, $rawToken));

            AuditLogger::log('user.password_reset_requested', $user, null, ['email' => $normalizedEmail]);
        }

        return [
            'success' => true,
            'message' => 'If an account is associated with this email, password recovery instructions have been dispatched.',
        ];
    }

    /**
     * Verify token, update password, revoke old sessions, and delete token.
     */
    public function resetPassword(string $email, string $token, string $password): array
    {
        $normalizedEmail = strtolower(trim($email));
        $record = DB::table('password_reset_tokens')->where('email', $normalizedEmail)->first();

        if (! $record) {
            throw ValidationException::withMessages([
                'email' => ['Invalid or expired password reset link. Please request a new one.'],
            ]);
        }

        // Enforce 60-minute token expiration
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $normalizedEmail)->delete();
            throw ValidationException::withMessages([
                'token' => ['This password reset link has expired. Please request a new link.'],
            ]);
        }

        // Verify token hash
        if (! Hash::check($token, $record->token)) {
            throw ValidationException::withMessages([
                'token' => ['The provided password reset token is invalid.'],
            ]);
        }

        $user = User::where('email', $normalizedEmail)->firstOrFail();

        // Update password and clear used token
        $user->update([
            'password' => Hash::make($password),
        ]);

        // Revoke all existing Sanctum bearer tokens to immediately boot any compromised sessions
        $user->tokens()->delete();

        // Purge used token
        DB::table('password_reset_tokens')->where('email', $normalizedEmail)->delete();

        AuditLogger::log('user.password_reset_completed', $user, null, ['email' => $normalizedEmail]);

        return [
            'success' => true,
            'message' => 'Your password has been successfully reset. You may now sign in with your new credentials.',
            'user' => $user,
        ];
    }
}

