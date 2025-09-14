import { formatDistanceToNow } from "date-fns";
import { 
  Bell, 
  Gift, 
  Calendar, 
  Info, 
  AlertCircle,
  Clock,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "booking_pending" | "booking_confirmed" | "booking_cancelled" | "booking_reminder" | "payment_success" | "payment_failed" | "admin_broadcast" | "system" | "promotion";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  data?: {
    bookingId?: string;
    groundId?: string;
    amount?: number;
    actionUrl?: string;
    metadata?: any;
  };
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const typeIcons = {
  booking_pending: Clock,
  booking_confirmed: Calendar,
  booking_cancelled: AlertCircle,
  booking_reminder: Clock,
  payment_success: Gift,
  payment_failed: AlertCircle,
  admin_broadcast: Bell,
  system: Info,
  promotion: Gift,
};

const typeColors = {
  booking_pending: "text-yellow-600",
  booking_confirmed: "text-green-600",
  booking_cancelled: "text-red-600",
  booking_reminder: "text-blue-600",
  payment_success: "text-green-600",
  payment_failed: "text-red-600",
  admin_broadcast: "text-purple-600",
  system: "text-gray-600",
  promotion: "text-orange-600",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
  urgent: "bg-red-200 text-red-800",
};

export default function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const TypeIcon = typeIcons[notification.type];
  
  return (
    <div className={`p-4 border-b transition-colors ${
      !notification.isRead 
        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
        : 'bg-white hover:bg-gray-50'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 p-2 rounded-full ${
          !notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <TypeIcon className={`h-5 w-5 ${typeColors[notification.type]}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className={`font-medium text-sm ${
                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {notification.title}
                {!notification.isRead && (
                  <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge 
                variant="secondary" 
                className={`text-xs ${priorityColors[notification.priority]}`}
              >
                {notification.priority}
              </Badge>
              
              {!notification.isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMarkAsRead(notification._id)}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark read
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(notification.createdAt), { 
                addSuffix: true 
              })}
            </span>
            <Badge variant="outline" className="text-xs capitalize">
              {notification.type}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
