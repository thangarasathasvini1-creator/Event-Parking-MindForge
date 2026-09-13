export interface Notification {
  notificationId: number;
  customerId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}