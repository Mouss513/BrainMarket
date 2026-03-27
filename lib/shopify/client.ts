// ============================================================
// Shopify API client
// ============================================================

const SHOPIFY_API_VERSION = '2024-10'

export interface ShopifyProduct {
  id: number
  title: string
  product_type: string
  variants: { price: string; inventory_quantity: number }[]
  created_at: string
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

  // Safe request that returns null on error instead of throwing
  private async safeRequest<T>(endpoint: string): Promise<T | null> {
    try {
      return await this.request<T>(endpoint)
    } catch {
      return null
    }
  }

  async getProducts(limit = 50): Promise<ShopifyProduct[]> {
    const data = await this.request<{ products: ShopifyProduct[] }>(
      `/products.json?limit=${limit}&status=active`
    )
    return data.products
  }

  async getOrdersCount(createdAtMin?: string): Promise<number | null> {
    let url = '/orders/count.json?status=any'
    if (createdAtMin) {
      url += `&created_at_min=${encodeURIComponent(createdAtMin)}`
    }
    const data = await this.safeRequest<{ count: number }>(url)
    return data ? data.count : null
  }

  async getProductsCount(): Promise<number | null> {
    const data = await this.safeRequest<{ count: number }>('/products/count.json')
    return data ? data.count : null
  }

  async getShopInfo(): Promise<{ name: string; domain: string; email: string }> {
    const data = await this.request<{ shop: { name: string; domain: string; email: string } }>(
      '/shop.json'
    )
    return data.shop
  }
}
