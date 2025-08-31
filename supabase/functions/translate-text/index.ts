import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, targetLanguage = 'en' } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Use LibreTranslate API (free, open source)
    const translateResponse = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'auto', // Auto-detect source language
        target: targetLanguage,
        format: 'text'
      })
    })

    if (!translateResponse.ok) {
      throw new Error(`Translation failed: ${translateResponse.statusText}`)
    }

    const translationResult = await translateResponse.json()

    return new Response(
      JSON.stringify({
        originalText: text,
        translatedText: translationResult.translatedText,
        detectedLanguage: translationResult.detectedLanguage?.language || 'unknown',
        targetLanguage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Translation error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        originalText: null,
        translatedText: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})