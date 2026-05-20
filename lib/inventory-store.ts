import { createClient } from './supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

export type Unit = 'pcs' | 'kg' | 'g' | 'l' | 'ml'

export const UNITS: { value: Unit; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'l', label: 'l' },
  { value: 'ml', label: 'ml' },
]

export function getUnitLabel(unit: Unit): string {
  if (unit === 'pcs') return '개'
  return UNITS.find(u => u.value === unit)?.label || unit
}

export const PURCHASE_SITES = [
  '오프라인',
  '네이버',
  '쿠팡',
  '11번가',
  '지마켓',
  '올리브영',
  '이마트',
  '마켓컬리',
  '토스 쇼핑',
  '타오바오',
  '옥션',
  '인터파크',
  '무신사',
  'abc마트',
  '교보',
  '예스24',
  'SSG',
] as const

export interface PurchaseRecord {
  id: string
  price: number
  count: number
  volume: number
  unit: Unit
  quantity: number
  remainingQuantity: number
  purchaseDate: string
  expirationDate?: string
  site: string
  createdAt: string
}

export interface StockEntry {
  unit: Unit
  volume: number
  quantity: number
  purchaseHistory: PurchaseRecord[]
}

export interface Product {
  id: string
  name: string
  category: string
  stockEntries: StockEntry[]
  createdAt: string
  updatedAt: string
}

export interface InventoryStore {
  products: Product[]
  categories: string[]
}

const defaultCategories = ['화장품', '핸드크림', '립밤', '브레스 케어', '샤워', '생리', '약', '청소', '식품', '의류', '전자기기', '사무용품', '공구', '기타']

export async function searchProductsByName(query: string): Promise<Product[]> {
  const supabase = createClient()
  if (!query.trim()) return []
  
  const { data: productsData, error } = await supabase
    .from('products')
    .select('*, purchase_records(*)')
    .ilike('name', `%${query}%`)
    .order('name')

  if (error || !productsData) return []

  return productsData.map((p: any) => {
    const records: PurchaseRecord[] = p.purchase_records.map((r: any) => ({
      id: r.id,
      price: r.price,
      count: r.count,
      volume: r.volume,
      unit: r.unit,
      quantity: r.quantity,
      remainingQuantity: r.remaining_quantity,
      purchaseDate: r.purchase_date,
      expirationDate: r.expiration_date,
      site: r.site,
      createdAt: r.created_at,
    }))

    const stockEntriesMap = new Map<string, StockEntry>()
    records.forEach(r => {
      const key = `${r.unit}-${r.volume}`
      if (!stockEntriesMap.has(key)) {
        stockEntriesMap.set(key, {
          unit: r.unit,
          volume: r.volume,
          quantity: 0,
          purchaseHistory: [],
        })
      }
      const entry = stockEntriesMap.get(key)!
      entry.quantity += r.remainingQuantity
      entry.purchaseHistory.push(r)
    })

    return {
      id: p.id,
      name: p.name,
      category: p.category,
      stockEntries: Array.from(stockEntriesMap.values()),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }
  })
}

export async function getInventoryData(): Promise<InventoryStore> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { products: [], categories: defaultCategories }

  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*, purchase_records(*)')
    .order('name')

  if (productsError) {
    console.error('Error fetching products:', productsError)
    return { products: [], categories: defaultCategories }
  }

  const products: Product[] = productsData.map((p: any) => {
    // Group purchase records into stock entries
    const records: PurchaseRecord[] = p.purchase_records.map((r: any) => ({
      id: r.id,
      price: r.price,
      count: r.count,
      volume: r.volume,
      unit: r.unit,
      quantity: r.quantity,
      remainingQuantity: r.remaining_quantity,
      purchaseDate: r.purchase_date,
      expirationDate: r.expiration_date,
      site: r.site,
      createdAt: r.created_at,
    }))

    const stockEntriesMap = new Map<string, StockEntry>()
    records.forEach(r => {
      const key = `${r.unit}-${r.volume}`
      if (!stockEntriesMap.has(key)) {
        stockEntriesMap.set(key, {
          unit: r.unit,
          volume: r.volume,
          quantity: 0,
          purchaseHistory: [],
        })
      }
      const entry = stockEntriesMap.get(key)!
      entry.quantity += r.remainingQuantity
      entry.purchaseHistory.push(r)
    })

    return {
      id: p.id,
      name: p.name,
      category: p.category,
      stockEntries: Array.from(stockEntriesMap.values()),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }
  })

  // Extract unique categories
  const categoriesSet = new Set(defaultCategories)
  products.forEach(p => categoriesSet.add(p.category))
  const categories = Array.from(categoriesSet).sort((a, b) => {
    const indexA = defaultCategories.indexOf(a)
    const indexB = defaultCategories.indexOf(b)
    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1
    return a.localeCompare(b)
  })

  return { products, categories }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const supabase = createClient()
  const { data: p, error } = await supabase
    .from('products')
    .select('*, purchase_records(*)')
    .eq('id', id)
    .single()

  if (error || !p) return undefined

  const records: PurchaseRecord[] = p.purchase_records.map((r: any) => ({
    id: r.id,
    price: r.price,
    count: r.count,
    volume: r.volume,
    unit: r.unit,
    quantity: r.quantity,
    remainingQuantity: r.remaining_quantity,
    purchaseDate: r.purchase_date,
    expirationDate: r.expiration_date,
    site: r.site,
    createdAt: r.created_at,
  }))

  const stockEntriesMap = new Map<string, StockEntry>()
  records.forEach(r => {
    const key = `${r.unit}-${r.volume}`
    if (!stockEntriesMap.has(key)) {
      stockEntriesMap.set(key, {
        unit: r.unit,
        volume: r.volume,
        quantity: 0,
        purchaseHistory: [],
      })
    }
    const entry = stockEntriesMap.get(key)!
    entry.quantity += r.remainingQuantity
    entry.purchaseHistory.push(r)
  })

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    stockEntries: Array.from(stockEntriesMap.values()),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }
}

export async function addPurchaseToProduct(
  productName: string,
  category: string,
  unit: Unit,
  count: number,
  volume: number,
  price: number,
  purchaseDate: string,
  site: string,
  expirationDate?: string
): Promise<Product | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Find or create product
  let { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .ilike('name', productName)
    .single()

  if (productError && productError.code !== 'PGRST116') {
    console.error('Error finding product:', productError)
    return null
  }

  if (!product) {
    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert({
        name: productName,
        category: category,
        user_id: user.id,
      })
      .select('id')
      .single()
    
    if (createError) {
      console.error('Error creating product:', createError)
      return null
    }
    product = newProduct
  } else {
    // Update category if it changed
    await supabase.from('products').update({ category }).eq('id', product.id)
  }

  const totalQuantity = count * volume
  const { error: recordError } = await supabase
    .from('purchase_records')
    .insert({
      product_id: product.id,
      user_id: user.id,
      price,
      count,
      volume,
      unit,
      quantity: totalQuantity,
      remaining_quantity: totalQuantity,
      purchase_date: purchaseDate,
      expiration_date: expirationDate || null,
      site,
    })

  if (recordError) {
    console.error('Error adding purchase record:', recordError)
    return null
  }

  return getProductById(product.id) as any
}

export async function useProduct(
  productId: string,
  unit: Unit,
  volume: number,
  quantityToUse: number
): Promise<Product | null> {
  const supabase = createClient()
  
  // Fetch records for this unit/volume, ordered by purchase date (FIFO)
  const { data: records, error } = await supabase
    .from('purchase_records')
    .select('*')
    .eq('product_id', productId)
    .eq('unit', unit)
    .eq('volume', volume)
    .gt('remaining_quantity', 0)
    .order('purchase_date', { ascending: true })

  if (error || !records) return null

  let remainingToUse = quantityToUse
  for (const record of records) {
    if (remainingToUse <= 0) break
    
    const amountToSubtract = Math.min(record.remaining_quantity, remainingToUse)
    const newRemaining = record.remaining_quantity - amountToSubtract
    
    await supabase
      .from('purchase_records')
      .update({ remaining_quantity: newRemaining })
      .eq('id', record.id)
      
    remainingToUse -= amountToSubtract
  }

  return getProductById(productId) as any
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('products').delete().eq('id', productId)
  return !error
}

export async function deletePurchaseRecord(
  productId: string,
  unit: Unit,
  volume: number,
  purchaseRecordId: string
): Promise<Product | null> {
  const supabase = createClient()
  const { error } = await supabase.from('purchase_records').delete().eq('id', purchaseRecordId)
  if (error) return null

  // Check if product still has records
  const { count } = await supabase
    .from('purchase_records')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)

  if (count === 0) {
    await deleteProduct(productId)
    return null
  }

  return getProductById(productId) as any
}

export async function updatePurchaseRecord(
  productId: string,
  purchaseRecordId: string,
  updates: {
    productName: string
    category: string
    unit: Unit
    count: number
    volume: number
    price: number
    purchaseDate: string
    expirationDate?: string
    site: string
  }
): Promise<Product | null> {
  const supabase = createClient()
  
  // 1. Update product info
  await supabase.from('products').update({
    name: updates.productName,
    category: updates.category
  }).eq('id', productId)

  // 2. Fetch old record to calculate remaining quantity diff
  const { data: oldRecord } = await supabase
    .from('purchase_records')
    .select('*')
    .eq('id', purchaseRecordId)
    .single()
  
  if (!oldRecord) return null

  const newTotalQuantity = updates.count * updates.volume
  const quantityDiff = newTotalQuantity - oldRecord.quantity
  const newRemainingQuantity = Math.max(0, oldRecord.remaining_quantity + quantityDiff)

  // 3. Update record
  await supabase.from('purchase_records').update({
    unit: updates.unit,
    count: updates.count,
    volume: updates.volume,
    price: updates.price,
    purchase_date: updates.purchaseDate,
    expiration_date: updates.expirationDate || null,
    site: updates.site,
    quantity: newTotalQuantity,
    remaining_quantity: newRemainingQuantity,
  }).eq('id', purchaseRecordId)

  return getProductById(productId) as any
}

export async function updateStockQuantity(
  productId: string,
  unit: Unit,
  volume: number,
  newQuantity: number
): Promise<Product | null> {
  const supabase = createClient()
  
  // Distribute new quantity among purchase records
  const { data: records, error } = await supabase
    .from('purchase_records')
    .select('*')
    .eq('product_id', productId)
    .eq('unit', unit)
    .eq('volume', volume)
    .order('purchase_date', { ascending: false }) // Newest first

  if (error || !records || records.length === 0) return null

  let remainingToDistribute = newQuantity
  for (const record of records) {
    const amount = Math.min(record.quantity, remainingToDistribute)
    await supabase
      .from('purchase_records')
      .update({ remaining_quantity: amount })
      .eq('id', record.id)
    remainingToDistribute -= amount
  }

  // If there's still quantity left, add it to the newest record
  if (remainingToDistribute > 0) {
    const newest = records[0]
    const { data: newestRecord } = await supabase
      .from('purchase_records')
      .select('remaining_quantity')
      .eq('id', newest.id)
      .single()
    
    if (newestRecord) {
      await supabase
        .from('purchase_records')
        .update({ remaining_quantity: newestRecord.remaining_quantity + remainingToDistribute })
        .eq('id', newest.id)
    }
  }

  return getProductById(productId) as any
}
export function getLowestPrice(product: Product): number | null {
  const allPrices: number[] = []
  product.stockEntries.forEach(entry => {
    entry.purchaseHistory.forEach(record => {
      allPrices.push(record.price)
    })
  })
  if (allPrices.length === 0) return null
  return Math.min(...allPrices)
}

export function getTotalCount(product: Product): number {
  return product.stockEntries.reduce((sum, entry) => {
    return sum + Math.ceil(entry.quantity / entry.volume)
  }, 0)
}

function getTotalQuantity(product: Product): number {
  return product.stockEntries.reduce((sum, entry) => sum + entry.quantity, 0)
}

export function getLowestPriceWithSite(product: Product): { price: number; site: string } | null {
  let lowestRecord: PurchaseRecord | null = null
  product.stockEntries.forEach(entry => {
    entry.purchaseHistory.forEach(record => {
      if (!lowestRecord || record.price < lowestRecord.price) {
        lowestRecord = record
      }
    })
  })
  if (!lowestRecord) return null
  return { price: (lowestRecord as any).price, site: (lowestRecord as any).site }
}

export function getLastPurchaseDate(product: Product): string | null {
  let latestDate: string | null = null
  product.stockEntries.forEach(entry => {
    entry.purchaseHistory.forEach(record => {
      if (!latestDate || new Date(record.purchaseDate) > new Date(latestDate)) {
        latestDate = record.purchaseDate
      }
    })
  })
  return latestDate
}

export function getTotalPurchaseValue(product: Product): number {
  return product.stockEntries.reduce((sum, entry) => {
    return sum + entry.purchaseHistory.reduce((innerSum, record) => {
      return innerSum + (record.price * record.count)
    }, 0)
  }, 0)
}

export function getStats(products: Product[]) {
  const totalProducts = products.length
  const totalValue = products.reduce((sum, product) => {
    // For stats, we'll use the latest price * total remaining quantity
    let latestPrice = 0
    let latestDate: Date | null = null
    
    product.stockEntries.forEach(entry => {
      entry.purchaseHistory.forEach(record => {
        const d = new Date(record.purchaseDate)
        if (!latestDate || d > latestDate) {
          latestDate = d
          latestPrice = record.price
        }
      })
    })

    const totalQty = getTotalQuantity(product)
    return sum + (latestPrice * totalQty)
  }, 0)
  const outOfStock = products.filter(p => getTotalCount(p) === 0).length
  
  return {
    totalProducts,
    totalValue,
    outOfStockCount: outOfStock,
  }
}

// Placeholder for missing functions if needed by components
export function getPurchaseRecordById(product: Product, recordId: string): PurchaseRecord | undefined {
  for (const entry of product.stockEntries) {
    const record = entry.purchaseHistory.find(r => r.id === recordId)
    if (record) return record
  }
  return undefined
}
