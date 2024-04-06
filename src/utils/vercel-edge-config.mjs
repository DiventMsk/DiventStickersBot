export const { EDGE_CONFIG_ID: id, VERCEL_API_TOKEN: token } = process.env

export async function updateEdgeConfig(...items) {
  const response = await fetch(
    `https://api.vercel.com/v1/edge-config/${id}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    }
  )
  const { status } = await response.json()
  return status === 'ok'
}
