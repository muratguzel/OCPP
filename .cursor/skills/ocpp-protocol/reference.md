# OCPP Reference: Profiles and Message Types

## Message Type IDs (All Versions)

| ID | Type | Direction |
|----|------|-----------|
| 2 | CALL | Request |
| 3 | CALLRESULT | Response (success) |
| 4 | CALLERROR | Response (error) |

## OCPP 1.6 / 1.6J Profiles

| Profile | Description |
|---------|-------------|
| Core | BootNotification, Heartbeat, Authorize, StartTransaction, StopTransaction, StatusNotification, MeterValues |
| FirmwareManagement | GetDiagnostics, UpdateFirmware |
| LocalAuthListManagement | SendLocalList, GetLocalListVersion |
| RemoteTrigger | TriggerMessage |
| Reservation | ReserveNow, CancelReservation |
| SmartCharging | SetChargingProfile, ClearChargingProfile, GetCompositeSchedule |

### Core Messages (1.6)

- **BootNotification** (CP→CS): Charge point startup; returns `Accepted`/`Rejected`, `currentTime`, `interval`
- **Heartbeat** (CP→CS): Keep-alive; returns `currentTime`
- **Authorize** (CP→CS): Validate idTag before charging
- **StartTransaction** (CP→CS): Begin charging session
- **StopTransaction** (CP→CS): End charging session; includes `meterStop`
- **StatusNotification** (CP→CS): Connector status changes
- **MeterValues** (CP→CS): Periodic meter readings

### Remote Commands (CS→CP)

- **RemoteStartTransaction**, **RemoteStopTransaction**
- **UnlockConnector**
- **Reset** (Soft/Hard)
- **ChangeAvailability**
- **GetConfiguration**, **SetConfiguration**
- **ClearCache** (clears local auth list)
- **TriggerMessage** (request CP to send specific message)
- **GetDiagnostics**, **UpdateFirmware**

## OCPP 2.0.1 / 2.1 Profiles

| Profile | Description |
|---------|-------------|
| Core | BootNotification, Heartbeat, StatusNotification, TransactionEvent, RequestStartTransaction, RequestStopTransaction |
| Security | CertificateSigned, DeleteCertificate, ExtendedTriggerMessage, GetInstalledCertificateIds, GetLog, InstallCertificate, SignCertificate |
| Provisioning | GetBaseReport, GetReport, GetVariables, SetVariables |
| Authorization | Authorize, ClearCache |
| SmartCharging | ClearedChargingLimit, GetChargingProfiles, NotifyChargingLimit, SetChargingProfile |
| LocalController | DataTransfer |
| FirmwareManagement | GetLog, UpdateFirmware |
| Reservation | CancelReservation, ReservationStatusUpdate, ReserveNow |

### Transaction Model (2.x)

2.x uses **TransactionEvent** instead of separate StartTransaction/StopTransaction:
- `Started`, `Updated`, `Ended`

Includes `evseId`, `connectorId`, `transactionInfo`.

### Common 2.x Additions

- **GetVariables** / **SetVariables**: OCPP 2.x configuration
- **RequestStartTransaction** / **RequestStopTransaction**: CS-initiated transactions
- **DataTransfer**: Vendor-specific extensions
- **Certificate management**: Security profile for mutual TLS

## WebSocket Subprotocols

| Version | Subprotocol String |
|---------|-------------------|
| OCPP 1.6J | `ocpp1.6` |
| OCPP 2.0.1 | `ocpp2.0.1` |
| OCPP 2.1 | `ocpp2.1` |

Server can accept multiple subprotocols on the same endpoint.

## Status Values (ConnectorStatus)

| Value | Meaning |
|-------|---------|
| Available | Ready for charging |
| Preparing | Preparing (e.g. cable connected) |
| Charging | Actively charging |
| SuspendedEV | Suspended by vehicle |
| SuspendedEVSE | Suspended by station |
| Finishing | Finishing |
| Reserved | Reserved |
| Unavailable | Out of service |
| Faulted | Error state |

## Error Codes (1.6)

`NotImplemented`, `NotSupported`, `InternalError`, `ProtocolError`, `SecurityError`, `FormatViolation`, `GenericError`, `OccurrenceConstraintViolation`, `MessageTypeNotSupported`, `PropertyConstraintViolation`, `TypeConstraintViolation`.
