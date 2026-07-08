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
  const storeId = config.sslcommerzStoreId;
  const storePassword = config.sslcommerzStorePassword;
  const isLive = config.sslcommerzIsLive;

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

const validateAndProcessPayment = async (tran_id: string, val_id: string) => {
  // 1. Instantiate SSLCommerz
  const storeId = config.sslcommerzStoreId;
  const storePassword = config.sslcommerzStorePassword;
  const isLive = config.sslcommerzIsLive;

  const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive);

  // 2. Query SSLCommerz validation API using val_id
  const validationResponse = await sslcz.validate({ val_id });

  // 3. Find the Payment record by transactionId (tran_id)
  const payment = await prisma.payment.findFirst({
    where: { transactionId: tran_id },
  });

  if (!payment) {
    throw new AppError(404, 'Payment record not found');
  }

  const isValid =
    validationResponse &&
    (validationResponse.status === 'VALID' ||
      validationResponse.status === 'VALIDATED');
  const amountMatches =
    validationResponse &&
    Number(validationResponse.amount) === payment.amount;

  // 4. If verification fails or amount mismatches, set status to FAILED and throw
  if (!isValid || !amountMatches) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });
    throw new AppError(400, 'Payment verification failed or amount mismatched');
  }

  // 5. If verified successfully, update Payment to PAID and Booking to PAID in a transaction
  const [_, updatedBooking] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    }),
    prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: 'PAID',
      },
      include: {
        service: true,
        customer: {
          select: userSelect,
        },
      },
    }),
  ]);

  return updatedBooking;
};

const handleFailedPayment = async (tran_id: string) => {
  const payment = await prisma.payment.findFirst({
    where: { transactionId: tran_id },
  });

  if (!payment) {
    throw new AppError(404, 'Payment record not found');
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED' },
  });

  return updatedPayment;
};

const handleCancelledPayment = async (tran_id: string) => {
  console.log(`Payment transaction ${tran_id} was cancelled by user.`);
  const payment = await prisma.payment.findFirst({
    where: { transactionId: tran_id },
  });

  if (!payment) {
    throw new AppError(404, 'Payment record not found');
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED' },
  });

  return updatedPayment;
};

const getPaymentStatus = async (bookingId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    select: {
      status: true,
      amount: true,
      paidAt: true,
    },
  });

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  return payment;
};

export const paymentService = {
  initiatePayment,
  validateAndProcessPayment,
  handleFailedPayment,
  handleCancelledPayment,
  getPaymentStatus,
};
