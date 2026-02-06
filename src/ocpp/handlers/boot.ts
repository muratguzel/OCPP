/**
 * BootNotification handler - OCPP 1.6J and 2.x
 */
export function bootNotification(): {
  status: string;
  currentTime: string;
  interval: number;
} {
  return {
    status: 'Accepted',
    currentTime: new Date().toISOString(),
    interval: 300,
  };
}
