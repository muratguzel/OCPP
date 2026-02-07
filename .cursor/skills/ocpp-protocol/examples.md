# OCPP Node.js Examples

## CSMS with Multiple OCPP Versions

```javascript
import { RPCServer } from 'ocpp-rpc';

const server = new RPCServer({
  protocols: ['ocpp1.6', 'ocpp2.0.1', 'ocpp2.1'],
});

server.on('chargepoint', (cp) => {
  // Version-agnostic: BootNotification exists in all
  cp.handle('BootNotification', async (params) => {
    return {
      status: 'Accepted',
      currentTime: new Date().toISOString(),
      interval: 300,
    };
  });

  // OCPP 1.6: StartTransaction
  cp.handle('StartTransaction', async (params) => {
    return { idTagInfo: { status: 'Accepted' }, transactionId: 1 };
  });

  // OCPP 2.x: TransactionEvent (Started/Ended)
  cp.handle('TransactionEvent', async (params) => {
    if (params.eventType === 'Started') {
      return { idTokenInfo: { status: 'Accepted' } };
    }
    return {};
  });
});

await server.listen(9220);
```

## Charge Point with ocpp-rpc (OCPP 2.0.1)

```javascript
import { RPCClient } from 'ocpp-rpc';

const client = new RPCClient({
  url: 'wss://csms.example.com/ocpp',
  identity: 'CP_001',
  protocol: 'ocpp2.0.1',
});

await client.connect();

// Boot + periodic Heartbeat
const boot = await client.call('BootNotification', {
  chargePointVendor: 'Vendor',
  chargePointModel: 'Model',
  firmwareVersion: '1.0',
});

// Report connector status
await client.call('StatusNotification', {
  evseId: 1,
  connectorId: 1,
  connectorStatus: 'Available',
  timestamp: new Date().toISOString(),
});

// Respond to RemoteStartTransaction
client.handle('RequestStartTransaction', async (params) => {
  return { status: 'Accepted' };
});

client.handle('RequestStopTransaction', async (params) => {
  return { status: 'Accepted' };
});
```

## Raw Message Format (OCPP 1.6J)

```json
// Request: BootNotification
[2, "msg-123", "BootNotification", {"chargePointVendor":"X","chargePointModel":"Y"}]

// Success Response
[3, "msg-123", {"status":"Accepted","currentTime":"2025-02-06T12:00:00Z","interval":300}]

// Error Response
[4, "msg-123", "NotSupported", "", {}]
```

## Choosing Protocol Version

- Legacy hardware: OCPP 1.6 / 1.6J
- New deployments: OCPP 2.0.1 (stable, IEC standard)
- Latest features (V2X, ISO 15118-20): OCPP 2.1
