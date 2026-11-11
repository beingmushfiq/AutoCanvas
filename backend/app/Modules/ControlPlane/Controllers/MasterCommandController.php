<?php

namespace App\Modules\ControlPlane\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Services\MasterCommandService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MasterCommandController extends Controller
{
    public function __construct(
        protected MasterCommandService $commandService
    ) {}

    /**
     * Parse and process a natural-language administrative command.
     */
    public function execute(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'max:500'],
        ]);

        $admin = $request->user();
        $response = $this->commandService->parseAndExecute($validated['query'], $admin);

        return response()->json([
            'success' => true,
            'data' => $response,
        ]);
    }

    /**
     * Confirm a destructive command using signed confirmation token.
     */
    public function confirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'confirmation_token' => ['required', 'string', 'size:64'],
        ]);

        $admin = $request->user();
        $response = $this->commandService->confirmCommand($validated['confirmation_token'], $admin);

        return response()->json([
            'success' => true,
            'data' => $response,
            'message' => 'Command executed successfully.',
        ]);
    }
}

