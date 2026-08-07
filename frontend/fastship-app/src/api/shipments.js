import api from './client'

// The shipment routes are registered on a router with prefix "/shipment" and
// paths of "/", so the resource itself is "/shipment/". The trailing slash is
// deliberate: requesting "/shipment" earns a 307 redirect, and a cross-origin
// PATCH that has to be re-issued after a redirect is not worth the risk.
const SHIPMENT = '/shipment/'

// Only sellers and partners have a shipment list — a client's shipments are
// matched by contact email and have no endpoint of their own.
export async function getShipments(userType) {
  if (userType !== 'seller' && userType !== 'partner') {
    throw new Error(`No shipment list endpoint for user type: ${userType}`)
  }
  const { data } = await api.get(`/${userType}/shipments`)
  return data
}

export async function getShipment(id) {
  const { data } = await api.get(SHIPMENT, { params: { id } })
  return data
}

// Seller token required. Fields: content, weight, destination (int zip),
// client_contact_email, client_contact_phone.
export async function submitShipment(payload) {
  const { data } = await api.post(SHIPMENT, payload)
  return data
}

// Partner token required, and the backend checks that the token's partner is
// the one assigned to this shipment.
export async function updateShipment(id, payload) {
  const { data } = await api.patch(SHIPMENT, payload, { params: { id } })
  return data
}

// Cancelling is POST /shipment/cancel, not DELETE /shipment — the shipment row
// survives and simply gains a "cancelled" timeline event.
export async function cancelShipment(id) {
  const { data } = await api.post('/shipment/cancel', null, { params: { id } })
  return data
}
