// ============================================================
// Shopify API client
// ============================================================

const SHOPIFY_API_VERSION = '2024-10'

interface ShopifyProduct {
  id: number
  title: string
  product_type: string
  variants: { price: string; inventory_quantity: number }[]
  created_at: string
}

interface ShopifyOrder {
  id: number
  name: string
  total_price: string
  created_at: string
  line_items: { title: string; quantity: number; price: string }[]
}

export class ShopifyClient {
  private shop: string
  private accessToken: string

  constructor(shop: string, accessToken: string) {
    this.shop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '')
    this.accessToken = accessToken
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `https://${this.shop}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`
    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Shopify API ${res.status}: ${body}`)
    }

    return res.json() as Promise<T>
  }

  async getProducts(limit = 50): Promise<ShopifyProduct[]> {
    const data = await this.request<{ products: ShopifyProduct[] }>(
      `/products.json?limit=${limit}&status=active`
    )
    return data.products
  }

  async getOrders(limit = 50): Promise<ShopifyOrder[]> {
    const data = await this.request<{ orders: ShopifyOrder[] }>(
      `/orders.json?limit=${limit}&status=any`
    )
    return data.orders
  }

  async getShopInfo(): Promise<{ name: string; domain: string; email: string }> {
    const data = await this.request<{ shop: { name: string; domain: string; email: string } }>(
      '/shop.json'
    )
    return data.shop
  }
}
