import api from './client'

// Trailing slash required — "/shipment" 307-redirects, which a cross-origin
// PATCH shouldn't have to survive.
const SHIPMENT = '/shipment/'

// Clients have no shipment-list endpoint — matched by contact email instead.
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

// Cancel is POST /shipment/cancel, not DELETE — row survives, just gets a
// "cancelled" timeline event.
export async function cancelShipment(id) {
  const { data } = await api.post('/shipment/cancel', null, { params: { id } })
  return data
}
