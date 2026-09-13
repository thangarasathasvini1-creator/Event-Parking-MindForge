export interface Payment {
  paymentId: number;
  bookingId: number;
  amount: number;
  status: string;
  paymentMethod: string | null;
  transactionReference: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CreatePaymentRequest {
  paymentMethod: string;
  simulateSuccess?: boolean;
}