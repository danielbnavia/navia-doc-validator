import { init as initLD } from '@netlify/launchdarkly-server-sdk';
import type { Context } from "@netlify/functions";

/**
 * Example Netlify Function demonstrating LaunchDarkly feature flags
 *
 * Environment Variables Required:
 * - LAUNCHDARKLY_CLIENT_SIDE_ID: Your LaunchDarkly client-side ID
 */

export default async (req: Request, context: Context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (req.method === "OPTIONS") {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  try {
    // Get LaunchDarkly client-side ID from environment
    const clientSideID = process.env.LAUNCHDARKLY_CLIENT_SIDE_ID;

    if (!clientSideID) {
      return new Response(JSON.stringify({
        success: false,
        error: "LAUNCHDARKLY_CLIENT_SIDE_ID not configured"
      }), {
        status: 500,
        headers
      });
    }

    // Initialize LaunchDarkly client
    const client = initLD(clientSideID);
    await client.waitForInitialization();

    // Example feature flags
    const flagKey = 'enableMyNewFeature';
    const enhancedValidation = 'enableEnhancedValidation';

    // User context - in production, get from authentication
    const userContext = {
      kind: 'user',
      key: req.headers.get('x-user-id') || 'anonymous-user',
      email: req.headers.get('x-user-email') || undefined
    };

    // Get feature flag values
    const newFeatureEnabled = await client.variation(flagKey, userContext, false);
    const enhancedValidationEnabled = await client.variation(enhancedValidation, userContext, false);

    // Close client connection
    await client.close();

    return new Response(JSON.stringify({
      success: true,
      flags: {
        enableMyNewFeature: newFeatureEnabled,
        enableEnhancedValidation: enhancedValidationEnabled
      },
      user: userContext.key
    }), {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("Feature flag error:", error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Internal server error",
      details: error.stack
    }), {
      status: 500,
      headers
    });
  }
};
