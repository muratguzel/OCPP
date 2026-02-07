---
name: ocpp-protocol
description: Understands and implements the Open Charge Point Protocol (OCPP) for EV charging. Covers OCPP 1.6, 1.6J, 2.0.1, and 2.1 with Node.js implementation. Use when building charge points, CSMS backends, OCPP servers/clients, EV charging integrations, or when the user mentions OCPP, charge point protocol, or charging station communication.
---

# OCPP Protocol Implementation

## Protocol Overview

OCPP (Open Charge Point Protocol) enables standardized communication between **Charge Points** (CP) and **Central Systems** (CSMS). Transport: WebSocket; messaging: JSON (OCPP-J).

### Version Summary

| Version | Released | Transport | Notes |
|---------|----------|-----------|-------|
| OCPP 1.6 | 2015 | SOAP or JSON/WebSocket | "1.6J" = JSON variant |
| OCPP 1.6J | 2015 | WebSocket + JSON | Subprotocol: `ocpp1.6` |
| OCPP 2.0.1 | 2020 | WebSocket + JSON | Subprotocol: `ocpp2.0.1`; IEC 63584 standard |
| OCPP 2.1 | 2025 | WebSocket + JSON | Subprotocol: `ocpp2.1`; backward compatible with 2.0.1 app logic |

**Compatibility**: OCPP 1.6 and 2.x are **not** compatible. 2.1 is backward compatible with 2.0.1.

### Key Version Differences

- **1.6 / 1.6J**: Basic smart charging, reservations, local auth list, TriggerMessage.
- **2.0.1**: WSS/TLS, ISO 15118 (Plug and Charge), advanced smart charging, display messages, device management, better transactions.
- **2.1**: ISO 15118-20, V2X bidirectional charging, DER control, battery swapping, local cost calculation, prepaid/ad hoc payment, secure QR codes.

---

## Node.js Implementation

### Recommended Library: ocpp-rpc

`ocpp-rpc` supports OCPP 1.6J, 2.0.1J, and 2.1. Node.js >= 17.3.0.

```bash
npm install ocpp-rpc
```

### Central System (CSMS) Server

```javascript
import { RPCServer } from 'ocpp-rpc';

const server = new RPCServer({
  protocols: ['ocpp1.6', 'ocpp2.0.1', 'ocpp2.1'],
  strictMode: true,
});

// Handle charge point connections
server.on('chargepoint', async (cp) => {
  cp.on('connected', () => console.log('Charge point connected:', cp.id));
  cp.on('disconnected', () => console.log('Charge point disconnected:', cp.id));

  // Handle incoming OCPP requests from charge point
  cp.handle('BootNotification', async (params) => {
    return {
      status: 'Accepted',
      currentTime: new Date().toISOString(),
      interval: 300,
    };
  });

  cp.handle('StatusNotification', async (params) => {
    // Store status in your backend
    return {};
  });

  cp.handle('StartTransaction', async (params) => {
    return { idTagInfo: { status: 'Accepted' }, transactionId: 1 };
  });

  cp.handle('StopTransaction', async (params) => {
    return { idTagInfo: { status: 'Accepted' } };
  });
});

await server.listen(9220);
```

### Charge Point Client

```javascript
import { RPCClient } from 'ocpp-rpc';

const client = new RPCClient({
  url: 'ws://csms.example.com/ocpp/CP_001',
  identity: 'CP_001',
  protocol: 'ocpp2.0.1',  // or 'ocpp1.6', 'ocpp2.1'
});

await client.connect();

// Send BootNotification
const bootResult = await client.call('BootNotification', {
  chargePointVendor: 'Acme',
  chargePointModel: 'CP-100',
  chargePointSerialNumber: 'SN001',
});

// Send StatusNotification
await client.call('StatusNotification', {
  connectorId: 1,
  errorCode: 'NoError',
  status: 'Available',
});

// Receive requests from Central System (e.g. RemoteStartTransaction)
client.handle('RemoteStartTransaction', async (params) => {
  // Start charging
  return { status: 'Accepted' };
});

client.handle('RemoteStopTransaction', async (params) => {
  // Stop charging
  return { status: 'Accepted' };
});
```

### OCPP 1.6 vs 2.x Message Shape

**OCPP 1.6J** (4-element array):

```json
[2, "unique-id", "BootNotification", {"chargePointVendor":"Acme","chargePointModel":"CP-100"}]
```

**OCPP 2.x** (same array format; action names and payloads differ):

```json
[2, "unique-id", "BootNotification", {"chargePointVendor":"Acme","chargePointModel":"CP-100","firmwareVersion":"1.0"}]
```

---

## Implementation Workflow

### 1. Choose Role and Version

- **Charge Point**: implements CP behavior; initiates WebSocket to CSMS.
- **Central System**: implements CSMS; accepts WebSocket connections from CPs.

### 2. WebSocket URL Convention

- Charge Point → Central System: `wss://csms.example.com/ocpp/{chargePointId}`
- Charge Point ID must be unique per connection.

### 3. Security Profiles (OCPP 2.x)

| Profile | Transport |
|---------|-----------|
| 1 | Unauthenticated TLS (WSS) |
| 2 | TLS + charge point certificate |
| 3 | TLS + charge point certificate + certificate revocation |

### 4. Required Handlers by Role

**Charge Point** (handles CSMS-initiated): `RemoteStartTransaction`, `RemoteStopTransaction`, `UnlockConnector`, `GetConfiguration`, `SetConfiguration`, `TriggerMessage`, `Reset`, `ClearCache` (1.6), `ChangeAvailability`.

**Central System** (handles CP-initiated): `BootNotification`, `Heartbeat`, `StatusNotification`, `Authorize`, `StartTransaction`, `StopTransaction`, `MeterValues`, `DataTransfer`.

---

## Alternative Libraries

| Library | Versions | Notes |
|---------|----------|-------|
| **ocpp-rpc** | 1.6J, 2.0.1, 2.1 | Primary choice; symmetrical RPC, strict validation |
| **@extrawest/node-ts-ocpp** | 2.0.1 | TypeScript, OCPP 2.0.1 only |
| **ocpp-js** | 1.6 | Older; JS implementation |
| **ocpp-task-manager** | Agnostic | Transport-agnostic; build custom CP/CSMS |

---

## Quick Reference

- OCPP spec: https://openchargealliance.org/protocols/
- OCPP 1.6 schemas: https://ocpp-spec.org/schemas/v1.6/
- ocpp-rpc: https://github.com/mikuso/ocpp-rpc

For detailed message types and profiles, see [reference.md](reference.md).
