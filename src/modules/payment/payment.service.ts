import AppError from '../../errors/AppError.js';
import { prisma } from '../../shared/prisma.js';
import config from '../../config/index.js';
// @ts-ignore
import SSLCommerzPayment from 'sslcommerz-lts';

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isBlocked: true,
  createdAt: true,
  updatedAt: true,
};

const initiatePayment = async (customerId: string, bookingId: string) => {
  // 1. Fetch booking with service + customer relations
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      customer: {
        select: userSelect,
      },
    },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // 2. Verify booking.customerId matches customerId
  if (booking.customerId !== customerId) {
    throw new AppError(403, 'You do not have permission to pay for this booking');
  }

  // 3. Throw AppError 400 if booking.status is not ACCEPTED
  if (booking.status !== 'ACCEPTED') {
    throw new AppError(400, 'Can only pay for accepted bookings');
  }

  // 4. Check if a Payment already exists for this booking with status PAID
  const existingPayment = await prisma.payment.findUnique({
    where: { bookingId },
  });

  if (existingPayment && existingPayment.status === 'PAID') {
    throw new AppError(400, 'This booking has already been paid');
  }

  // 5. Generate unique transaction ID
  const tranId = `booking_${bookingId}_${Date.now()}`;

  // 6. Build SSLCommerz init payload
  const storeId = config.sslcommerzStoreId || config.SSLCOMMERZ_STORE_ID;
  const storePassword =
    config.sslcommerzStorePassword || config.SSLCOMMERZ_STORE_PASSWORD;
  const isLive = config.sslcommerzIsLive || config.SSLCOMMERZ_IS_LIVE;

  const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive);

  const initData = {
    total_amount: booking.totalAmount,
    currency: 'BDT',
    tran_id: tranId,
    success_url: `${config.baseUrl}/api/v1/payments/callback/success`,
    fail_url: `${config.baseUrl}/api/v1/payments/callback/fail`,
    cancel_url: `${config.baseUrl}/api/v1/payments/callback/cancel`,
    ipn_url: `${config.baseUrl}/api/v1/payments/callback/ipn`,
    shipping_method: 'NO',
    product_name: booking.service.name,
    product_category: 'Service',
    product_profile: 'general',
    cus_name: booking.customer.name,
    cus_email: booking.customer.email,
    cus_phone: booking.customer.phone,
    cus_add1: booking.address || 'Dhaka',
    cus_country: 'Bangladesh',
  };

  // 7. Call sslcommerz-lts init
  const sslcommerzResponse = await sslcz.init(initData);

  if (
    !sslcommerzResponse ||
    sslcommerzResponse.status !== 'SUCCESS' ||
    !sslcommerzResponse.GatewayPageURL
  ) {
    throw new AppError(
      400,
      sslcommerzResponse?.failedreason ||
        'Failed to initiate payment session with SSLCommerz'
    );
  }

  // 8. Upsert a Payment record (create if none exists for this booking, else update)
  await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      amount: booking.totalAmount,
      currency: 'BDT',
      provider: 'SSLCOMMERZ',
      transactionId: tranId,
      status: 'PENDING',
    },
    update: {
      amount: booking.totalAmount,
      currency: 'BDT',
      provider: 'SSLCOMMERZ',
      transactionId: tranId,
      status: 'PENDING',
    },
  });

  // 9. Return the GatewayPageURL
  return sslcommerzResponse.GatewayPageURL;
};

export const paymentService = {
  initiatePayment,
};
