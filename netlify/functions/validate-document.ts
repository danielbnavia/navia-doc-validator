import Anthropic from "@anthropic-ai/sdk";
import { init as initLD } from '@netlify/launchdarkly-server-sdk';
import type { Context } from "@netlify/functions";

const SYSTEM_PROMPT = `You are a logistics document validation specialist for Navia, a 3PL/freight forwarding company.

**Your Task:** Extract and validate key fields from customs/shipping documents (HBL, Commercial Invoice, Packing List).

**Fields to Extract:**
1. **Shipper Information:** Name, Address, Contact
2. **Consignee Information:** Name, Address, Contact
3. **Document Numbers:** HBL#, Invoice#, PO#
4. **Shipment Details:** Origin Port, Destination Port, Carrier
5. **Cargo Details:** Description, Quantity, Weight, Volume
6. **Financial:** Total Value, Currency, Payment Terms
7. **Dates:** Issue Date, Shipment Date, Delivery Date

**Validation Rules:**
- Flag missing critical fields (Shipper, Consignee, HBL#)
- Check for inconsistencies across documents
- Verify totals match line items
- Identify format issues

**Output Format (JSON ONLY - NO MARKDOWN):**
{
  "documentType": "HBL|Invoice|PackingList",
  "extractedFields": {
    "shipper": { "name": "...", "address": "...", "contact": "..." },
    "consignee": { "name": "...", "address": "...", "contact": "..." },
    "hblNumber": "...",
    "invoiceNumber": "...",
    "cargoDescription": "...",
    "totalValue": "...",
    "currency": "..."
  },
  "validationStatus": "PASS|FAIL|WARNING",
  "issues": [
    { "field": "...", "severity": "ERROR|WARNING", "message": "..." }
  ],
  "confidence": 0.95
}`;

export default async (req: Request, context: Context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (req.method === "OPTIONS") {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ 
      success: false,
      error: "Method not allowed" 
    }), {
      status: 405,
      headers
    });
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    // Optional: LaunchDarkly feature flags
    let enhancedValidationEnabled = false;
    if (process.env.LAUNCHDARKLY_CLIENT_SIDE_ID) {
      try {
        const ldClient = initLD(process.env.LAUNCHDARKLY_CLIENT_SIDE_ID);
        await ldClient.waitForInitialization();
        const userContext = { kind: 'user', key: 'validator-user' };
        enhancedValidationEnabled = await ldClient.variation('enableEnhancedValidation', userContext, false);
        await ldClient.close();
        console.log(`Enhanced validation: ${enhancedValidationEnabled}`);
      } catch (ldError) {
        console.warn("LaunchDarkly not available, using default settings:", ldError);
      }
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "No file provided" 
      }), {
        status: 400,
        headers
      });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please validate this shipping document and extract all key fields. Return ONLY valid JSON, no markdown formatting."
            },
            {
              type: "document",
              source: {
                type: "base64",
                media_type: file.type,
                data: base64Data
              }
            }
          ]
        }
      ],
      system: SYSTEM_PROMPT
    });

    const responseText = message.content[0].type === "text" 
      ? message.content[0].text 
      : "";

    console.log("Raw Claude response:", responseText.substring(0, 200));

    // Strip markdown code blocks if present
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    let result;
    try {
      result = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Cleaned text:", cleanedText.substring(0, 500));
      result = { 
        rawResponse: cleanedText,
        parseError: "Could not parse JSON response"
      };
    }

    return new Response(JSON.stringify({
      success: true,
      result,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      }
    }), {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("Validation error:", error);
    
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
