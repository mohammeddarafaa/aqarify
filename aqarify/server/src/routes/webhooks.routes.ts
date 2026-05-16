// server/src/routes/webhooks.routes.ts
import { Router, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { verifyPaymobHmac } from '../utils/hmac';
import { decrypt } from '../utils/encryption';
import { emitDomainEvent } from '../events/domainEventBus';

const router = Router();

// Rate limit: 120 requests per minute per IP
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many webhook requests',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(webhookLimiter);

// Paymob webhook handler
router.post('/paymob', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const payload = req.body;
    const signature = req.headers['x-hmac-signature'] as string;

    logger.info('Webhook received', {
      type: 'paymob',
      transactionId: payload.id,
      tenantId: req.tenantId,
    });

    // Retrieve tenant to get Paymob secret
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('paymob_secret, subscription_status')
      .eq('id', req.tenantId)
      .single();

    if (tenantError || !tenant) {
      logger.warn('Tenant not found for webhook', { tenantId: req.tenantId });
      // Always return 200 to not fingerprint the endpoint
      return res.status(200).json({ received: true });
    }

    // Check subscription status
    if (tenant.subscription_status === 'suspended') {
      logger.warn('Webhook from suspended tenant', { tenantId: req.tenantId });
      return res.status(200).json({ received: true });
    }

    // Decrypt the secret
    let paymobSecret: string;
    try {
      paymobSecret = decrypt(tenant.paymob_secret);
    } catch (error) {
      logger.error('Failed to decrypt Paymob secret', {
        tenantId: req.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(200).json({ received: true });
    }

    // Verify HMAC signature
    const payloadString = JSON.stringify(payload);
    let isValid = false;
    try {
      isValid = verifyPaymobHmac(payload, signature, paymobSecret);
    } catch (error) {
      logger.warn('HMAC verification failed', {
        tenantId: req.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if (!isValid) {
      logger.warn('Invalid webhook signature', {
        tenantId: req.tenantId,
        transactionId: payload.id,
      });
      // Return 200 without processing (don't fingerprint endpoint)
      return res.status(200).json({ received: true });
    }

    // Check idempotency: has this webhook already been processed?
    const { data: existingEvent, error: checkError } = await supabaseAdmin
      .from('webhook_events')
      .select('id, status')
      .eq('tenant_id', req.tenantId)
      .eq('source', 'paymob')
      .eq('external_id', String(payload.id))
      .single();

    if (!checkError && existingEvent) {
      logger.info('Webhook already processed (idempotent)', {
        tenantId: req.tenantId,
        transactionId: payload.id,
        status: existingEvent.status,
      });
      return res.status(200).json({
        received: true,
        duplicated: true,
      });
    }

    // Insert webhook event FIRST (before processing) to ensure idempotency
    const { data: webhookRecord, error: insertError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        tenant_id: req.tenantId,
        source: 'paymob',
        external_id: String(payload.id),
        payload,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to insert webhook record', {
        tenantId: req.tenantId,
        error: insertError.message,
      });
      return res.status(200).json({ received: true });
    }

    // Now process the webhook
    await processPaymobWebhook(
      supabaseAdmin,
      req.tenantId!,
      payload,
      webhookRecord.id
    );

    // Update webhook status to processed
    await supabaseAdmin
      .from('webhook_events')
      .update({ status: 'processed' })
      .eq('id', webhookRecord.id);

    logger.info('Webhook processed successfully', {
      tenantId: req.tenantId,
      transactionId: payload.id,
    });

    res.status(200).json({
      received: true,
      processed: true,
    });
  } catch (error) {
    logger.error('Webhook processing error', {
      error: error instanceof Error ? error.message : String(error),
      body: req.body,
    });
    // Always return 200
    res.status(200).json({ received: true });
  }
});

async function processPaymobWebhook(
  supabaseAdmin: SupabaseClient,
  tenantId: string,
  payload: any,
  webhookEventId: string
): Promise<void> {


  // Check payment status
  if (payload.success !== true) {
    logger.info('Payment unsuccessful in webhook', {
      transactionId: payload.id,
      success: payload.success,
    });
    return;
  }

  // Find reservation by transaction ID
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('reservation_payments')
    .select('reservation_id')
    .eq('external_transaction_id', String(payload.id))
    .eq('tenant_id', tenantId)
    .single();

  if (paymentError || !payment) {
    logger.warn('No reservation payment found for transaction', {
      transactionId: payload.id,
      tenantId,
    });
    return;
  }

  // Update payment status
  await supabaseAdmin
    .from('reservation_payments')
    .update({
      status: 'completed',
      completed_at: new Date(),
    })
    .eq('reservation_id', payment.reservation_id)
    .eq('tenant_id', tenantId);

  // Update reservation status to payment_confirmed
  const { data: reservation, error: updateError } = await supabaseAdmin
    .from('reservations')
    .update({
      status: 'payment_confirmed',
      payment_confirmed_at: new Date(),
    })
    .eq('id', payment.reservation_id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to update reservation status', {
      error: updateError.message,
    });
    await supabaseAdmin
      .from('webhook_events')
      .update({
        status: 'failed',
        error: updateError.message,
      })
      .eq('id', webhookEventId);
    return;
  }

  // Emit domain event for downstream handlers
  await emitDomainEvent({
    eventType: 'reservation.payment_confirmed',
    tenantId,
    payload: {
      reservationId: payment.reservation_id,
      customerId: reservation.customer_id,
      unitId: reservation.unit_id,
      transactionId: payload.id,
      tenantId,
    },
  });

  logger.info('Payment confirmed via webhook', {
    reservationId: payment.reservation_id,
    transactionId: payload.id,
  });
}

export default router;
export const webhookRoutes = router;