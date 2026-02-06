/**
 * Authorize handler - OCPP 1.6 (idTag) and 2.x (idToken).
 * First phase: always accept. Later: call Backend API to validate.
 */
type AuthorizeParams = { idTag?: string; idToken?: string };

export function authorize(params: AuthorizeParams): { idTagInfo?: { status: string }; idTokenInfo?: { status: string } } {
  const status = 'Accepted';
  if (params.idToken !== undefined) {
    return { idTokenInfo: { status } };
  }
  return { idTagInfo: { status } };
}
