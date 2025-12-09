
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as admin from 'https://esm.sh/firebase-admin@12.1.0/app'
import { getMessaging } from 'https://esm.sh/firebase-admin@12.1.0/messaging'

// Initialize Firebase Admin SDK
try {
  const fcmPrivateKey = Deno.env.get('FCM_PRIVATE_KEY')
  if (!fcmPrivateKey) throw new Error('FCM_PRIVATE_KEY is not set.')

  // The 'replace' is necessary because environment variables escape newlines.
  const privateKey = fcmPrivateKey.replace(/\\n/g, '\n');
  
  const serviceAccount = {
    projectId: Deno.env.get('FCM_PROJECT_ID'),
    clientEmail: Deno.env.get('FCM_CLIENT_EMAIL'),
    privateKey: privateKey,
  }

  admin.initializeApp({
    credential: admin.cert(serviceAccount),
  });
} catch (error) {
  console.error("Firebase Admin SDK initialization error:", error.message);
}


serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { tokens, title, body, data } = await req.json();

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid "tokens" array.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const message = {
      notification: { title, body },
      data: data || {},
      tokens: tokens,
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            'content-available': 1,
            badge: 1, // You might want to handle badge count on your server
            sound: 'default'
          },
        },
      },
    };

    const response = await getMessaging().sendEachForMulticast(message);
    
    console.log(`Successfully sent ${response.successCount} messages.`);
    if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                failedTokens.push(tokens[idx]);
                console.error(`Token failed: ${tokens[idx]}, Error: ${resp.error?.message}`);
            }
        });
        // You might want to handle cleanup of invalid tokens from your DB here
    }

    return new Response(JSON.stringify({ success: true, response }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
