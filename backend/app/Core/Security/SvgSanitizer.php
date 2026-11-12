<?php

namespace App\Core\Security;

class SvgSanitizer
{
    /**
     * Sanitize SVG markup to neutralize stored XSS, XXE, and script injection vectors.
     *
     * @param string $content Raw SVG file contents
     * @return string Sanitized SVG content safe for storage and serving
     */
    public static function sanitize(string $content): string
    {
        // 1. Defend against XXE (XML External Entity injection): neutralize DOCTYPE and entity declarations
        $content = preg_replace('/<!DOCTYPE\b[^\[>]*(\[[^\]]*\])?\s*>/is', '', $content);
        $content = preg_replace('/<!ENTITY\b[^>]*>/is', '', $content);

        // 2. Neutralize script blocks (<script>...</script> or self-closing <script ... />)
        $content = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $content);
        $content = preg_replace('/<script\b[^>]*\/>/is', '', $content);

        // 3. Neutralize inline event handlers (onload, onclick, onerror, onmouseover, etc.)
        $content = preg_replace('/\s*on[a-zA-Z]+\s*=\s*("[^"]*"|\'[^\']*\')/i', '', $content);
        $content = preg_replace('/\s*on[a-zA-Z]+\s*=\s*[^>\s]+/i', '', $content);

        // 4. Neutralize javascript: and unsafe data: URIs in href and xlink:href attributes
        $content = preg_replace('/(href|xlink:href)\s*=\s*("[^"]*javascript:[^"]*"|\'[^\']*javascript:[^\']*\')/is', '$1=""', $content);
        $content = preg_replace('/(href|xlink:href)\s*=\s*("[^"]*data:text\/html[^"]*"|\'[^\']*data:text\/html[^\']*\')/is', '$1=""', $content);

        // 5. Neutralize dangerous tags that can embed arbitrary documents, frames, or foreign markup
        $content = preg_replace('/<(\/)?(foreignObject|embed|object|iframe|applet|meta|link|base)\b[^>]*>/i', '', $content);

        return $content;
    }
}
