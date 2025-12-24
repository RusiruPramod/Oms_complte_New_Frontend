// Time Range Service for Order Management
const TIME_RANGE_KEY = 'orderTimeRange';

interface TimeRange {
  startTime: string;
  endTime: string;
  startPeriod: 'AM' | 'PM';
  endPeriod: 'AM' | 'PM';
}

export const saveTimeRange = (timeRange: TimeRange): void => {
  localStorage.setItem(TIME_RANGE_KEY, JSON.stringify(timeRange));
};

export const getTimeRange = (): TimeRange => {
  const stored = localStorage.getItem(TIME_RANGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Default time range: 9:00 AM to 6:00 PM
  return {
    startTime: '09:00',
    endTime: '18:00',
    startPeriod: 'AM',
    endPeriod: 'PM',
  };
};

// Convert time to 24-hour format for comparison
export const convertTo24Hour = (time: string, period: 'AM' | 'PM'): number => {
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (period === 'PM' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  return hour24 * 60 + minutes; // Return total minutes for easier comparison
};

// Check if an order time falls within the active time range
export const isOrderInTimeRange = (orderDate: string, timeRange: TimeRange): boolean => {
  const orderTime = new Date(orderDate);
  const today = new Date();
  
  // Check if order is from today
  if (
    orderTime.getDate() !== today.getDate() ||
    orderTime.getMonth() !== today.getMonth() ||
    orderTime.getFullYear() !== today.getFullYear()
  ) {
    return false;
  }
  
  // Get order time in minutes
  const orderMinutes = orderTime.getHours() * 60 + orderTime.getMinutes();
  
  // Get time range in minutes
  const startMinutes = convertTo24Hour(timeRange.startTime, timeRange.startPeriod);
  const endMinutes = convertTo24Hour(timeRange.endTime, timeRange.endPeriod);
  
  // Check if order falls within range
  return orderMinutes >= startMinutes && orderMinutes <= endMinutes;
};

// Get today's orders count within time range
export const getTodaysOrdersCount = (orders: any[]): number => {
  const timeRange = getTimeRange();
  return orders.filter(order => isOrderInTimeRange(order.createdAt, timeRange)).length;
};
