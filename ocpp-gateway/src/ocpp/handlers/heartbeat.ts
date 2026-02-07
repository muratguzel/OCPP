/**
 * Heartbeat handler - OCPP 1.6J and 2.x
 */
export function heartbeat(): { currentTime: string } {
  return {
    currentTime: new Date().toISOString(),
  };
}
