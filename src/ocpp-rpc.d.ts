declare module 'ocpp-rpc' {
  export class RPCServer {
    constructor(options: {
      protocols?: string[];
      strictMode?: boolean;
      [key: string]: unknown;
    });
    on(event: 'client', callback: (client: {
      identity: string;
      protocol?: string;
      handle: (action: string, fn: (payload: { params: unknown }) => Promise<unknown> | unknown) => void;
      on: (event: string, fn: () => void) => void;
      call: (action: string, params: unknown) => Promise<unknown>;
    }) => void): void;
    listen(port: number): Promise<void>;
  }
}
