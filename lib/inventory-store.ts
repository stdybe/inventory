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
  quantity: number // original quantity = count * volume
  remainingQuantity: number // current remaining quantity
  purchaseDate: string
  expirationDate?: string // optional expiration date
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

const STORAGE_KEY = 'inventory-data-v3'

const defaultCategories = ['화장품', '핸드크림', '립밤', '브레스 케어', '샤워', '생리', '약', '청소', '식품', '의류', '전자기기', '사무용품', '공구', '기타']

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function getInventoryData(): InventoryStore {
  if (typeof window === 'undefined') {
    return { products: [], categories: defaultCategories }
  }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const data = JSON.parse(stored) as InventoryStore
      
      // Data migration
      let needsSave = false
      data.products.forEach(product => {
        product.stockEntries.forEach(entry => {
          if (entry.volume === undefined) {
            const firstRecord = entry.purchaseHistory[0]
            entry.volume = firstRecord ? firstRecord.volume : 1
            needsSave = true
          }
          
          // Migration for remainingQuantity
          entry.purchaseHistory.forEach(record => {
            if (record.remainingQuantity === undefined) {
              // If record was fully or partially "used" via old global quantity method,
              // we can't perfectly reconstruct it. Let's assume full for now
              // and let the total quantity be the sum of remaining quantities.
              record.remainingQuantity = record.quantity
              needsSave = true
            }
          })

          // Recalculate total entry quantity to match sum of remaining quantities
          const totalRemaining = entry.purchaseHistory.reduce((sum, r) => sum + r.remainingQuantity, 0)
          if (entry.quantity !== totalRemaining) {
            entry.quantity = totalRemaining
            needsSave = true
          }
        })
      })

      // Data migration: Ensure all default categories exist in the loaded data
      defaultCategories.forEach(cat => {
        if (!data.categories.includes(cat)) {
          data.categories.push(cat)
          needsSave = true
        }
      })

      // Sort categories: defaultCategories first, then others alphabetically
      data.categories.sort((a, b) => {
        const indexA = defaultCategories.indexOf(a)
        const indexB = defaultCategories.indexOf(b)
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return a.localeCompare(b)
      })
      
      if (needsSave) {
        saveInventoryData(data)
      }
      
      return data
    } catch {
      return { products: [], categories: defaultCategories }
    }
  }
  return { products: [], categories: defaultCategories }
}

function saveInventoryData(data: InventoryStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getProductById(id: string): Product | undefined {
  const data = getInventoryData()
  return data.products.find(p => p.id === id)
}

export function getPurchaseRecordById(productId: string, recordId: string): PurchaseRecord | undefined {
  const product = getProductById(productId)
  if (!product) return undefined
  for (const entry of product.stockEntries) {
    const record = entry.purchaseHistory.find(r => r.id === recordId)
    if (record) return record
  }
  return undefined
}

export function searchProductsByName(query: string): Product[] {
  const data = getInventoryData()
  if (!query.trim()) return []
  const lowerQuery = query.toLowerCase()
  return data.products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery)
  )
}

export function addPurchaseToProduct(
  productName: string,
  category: string,
  unit: Unit,
  count: number,
  volume: number,
  price: number,
  purchaseDate: string,
  site: string,
  expirationDate?: string
): Product {
  const data = getInventoryData()
  const now = new Date().toISOString()
  
  // Find existing product by name
  let product = data.products.find(p => p.name.toLowerCase() === productName.toLowerCase())
  
  const totalQuantity = count * volume
  const purchaseRecord: PurchaseRecord = {
    id: generateId(),
    price,
    count,
    volume,
    unit,
    quantity: totalQuantity,
    remainingQuantity: totalQuantity,
    purchaseDate,
    expirationDate,
    site,
    createdAt: now,
  }
  
  if (product) {
    // Product exists - update category if changed
    product.category = category
    
    // Find or create stock entry for this unit AND volume
    let stockEntry = product.stockEntries.find(se => se.unit === unit && se.volume === volume)
    
    if (stockEntry) {
      // Add to existing stock entry
      stockEntry.quantity += totalQuantity
      stockEntry.purchaseHistory.push(purchaseRecord)
    } else {
      // Create new stock entry for this unit and volume
      product.stockEntries.push({
        unit,
        volume,
        quantity: totalQuantity,
        purchaseHistory: [purchaseRecord],
      })
    }
    product.updatedAt = now
  } else {
    // Create new product
    product = {
      id: generateId(),
      name: productName,
      category,
      stockEntries: [{
        unit,
        volume,
        quantity: totalQuantity,
        purchaseHistory: [purchaseRecord],
      }],
      createdAt: now,
      updatedAt: now,
    }
    data.products.push(product)
  }
  
  if (!data.categories.includes(category)) {
    data.categories.push(category)
  }
  
  saveInventoryData(data)
  return product
}

export function updateStockQuantity(
  productId: string,
  unit: Unit,
  volume: number,
  newQuantity: number
): Product | null {
  const data = getInventoryData()
  const product = data.products.find(p => p.id === productId)
  if (!product) return null
  
  const stockEntry = product.stockEntries.find(se => se.unit === unit && se.volume === volume)
  if (stockEntry) {
    stockEntry.quantity = newQuantity
    
    // Distribute new quantity among purchase records (LIFO or proportional? 
    // Let's go with LIFO-ish: newest records keep their full quantity first, 
    // or just reset and distribute. Actually, manual stock update is rare.
    // Let's just distribute it among existing records proportionally or sequentially.)
    let remainingToDistribute = newQuantity
    const sortedHistory = [...stockEntry.purchaseHistory].sort(
      (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    )

    for (const record of sortedHistory) {
      const amount = Math.min(record.quantity, remainingToDistribute)
      record.remainingQuantity = amount
      remainingToDistribute -= amount
      
      const originalRecord = stockEntry.purchaseHistory.find(r => r.id === record.id)
      if (originalRecord) originalRecord.remainingQuantity = record.remainingQuantity
    }

    // If there's still quantity left, add it to the newest record even if it exceeds original count
    if (remainingToDistribute > 0 && stockEntry.purchaseHistory.length > 0) {
      const newest = sortedHistory[0]
      const originalRecord = stockEntry.purchaseHistory.find(r => r.id === newest.id)
      if (originalRecord) originalRecord.remainingQuantity += remainingToDistribute
    }

    product.updatedAt = new Date().toISOString()
    saveInventoryData(data)
  }
  
  return product
}

export function useProduct(
  productId: string,
  unit: Unit,
  volume: number,
  quantityToUse: number
): Product | null {
  const data = getInventoryData()
  const product = data.products.find(p => p.id === productId)
  if (!product) return null

  const stockEntry = product.stockEntries.find(se => se.unit === unit && se.volume === volume)
  if (stockEntry) {
    let remainingToUse = quantityToUse
    
    // Sort purchase history by date (oldest first) to implement FIFO
    const sortedHistory = [...stockEntry.purchaseHistory].sort(
      (a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
    )

    for (const record of sortedHistory) {
      if (remainingToUse <= 0) break
      
      const amountToSubtract = Math.min(record.remainingQuantity, remainingToUse)
      record.remainingQuantity -= amountToSubtract
      remainingToUse -= amountToSubtract

      // Update the original record in the purchaseHistory array
      const originalRecord = stockEntry.purchaseHistory.find(r => r.id === record.id)
      if (originalRecord) {
        originalRecord.remainingQuantity = record.remainingQuantity
      }
    }

    // Recalculate total quantity
    stockEntry.quantity = stockEntry.purchaseHistory.reduce((sum, r) => sum + r.remainingQuantity, 0)
    
    product.updatedAt = new Date().toISOString()
    saveInventoryData(data)
  }

  return product
}

export function deletePurchaseRecord(
  productId: string,
  unit: Unit,
  volume: number,
  purchaseRecordId: string
): Product | null {
  const data = getInventoryData()
  const product = data.products.find(p => p.id === productId)
  if (!product) return null
  
  const stockEntry = product.stockEntries.find(se => se.unit === unit && se.volume === volume)
  if (!stockEntry) return null
  
  const recordIndex = stockEntry.purchaseHistory.findIndex(r => r.id === purchaseRecordId)
  if (recordIndex === -1) return null
  
  const record = stockEntry.purchaseHistory[recordIndex]
  
  // Subtract the remaining quantity from this purchase record
  stockEntry.quantity = Math.max(0, stockEntry.quantity - record.remainingQuantity)
  
  // Remove the purchase record
  stockEntry.purchaseHistory.splice(recordIndex, 1)
  
  // If no more purchase history for this unit/volume, remove the stock entry
  if (stockEntry.purchaseHistory.length === 0) {
    const entryIndex = product.stockEntries.findIndex(se => se.unit === unit && se.volume === volume)
    if (entryIndex !== -1) {
      product.stockEntries.splice(entryIndex, 1)
    }
  }
  
  // If no more stock entries, delete the product
  if (product.stockEntries.length === 0) {
    const productIndex = data.products.findIndex(p => p.id === productId)
    if (productIndex !== -1) {
      data.products.splice(productIndex, 1)
    }
    saveInventoryData(data)
    return null
  }
  
  product.updatedAt = new Date().toISOString()
  saveInventoryData(data)
  return product
}

export function deleteProduct(productId: string): boolean {
  const data = getInventoryData()
  const index = data.products.findIndex(p => p.id === productId)
  if (index === -1) return false
  
  data.products.splice(index, 1)
  saveInventoryData(data)
  return true
}

export function updatePurchaseRecord(
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
): Product | null {
  const data = getInventoryData()
  const product = data.products.find(p => p.id === productId)
  if (!product) return null

  // Update product fields
  product.name = updates.productName
  product.category = updates.category

  // Find the record and its current unit
  let currentStockEntry: StockEntry | null = null
  let recordIndex = -1

  for (const entry of product.stockEntries) {
    const idx = entry.purchaseHistory.findIndex(r => r.id === purchaseRecordId)
    if (idx !== -1) {
      currentStockEntry = entry
      recordIndex = idx
      break
    }
  }

  if (!currentStockEntry || recordIndex === -1) return null

  const record = currentStockEntry.purchaseHistory[recordIndex]
  const oldRemainingQuantity = record.remainingQuantity
  const newTotalQuantity = updates.count * updates.volume
  
  // If original total quantity changed, we should adjust remaining quantity accordingly
  // (e.g., if we increased the purchase count, we increase remaining stock)
  const quantityDiff = newTotalQuantity - record.quantity
  const newRemainingQuantity = Math.max(0, oldRemainingQuantity + quantityDiff)

  // Update record fields
  record.unit = updates.unit
  record.count = updates.count
  record.volume = updates.volume
  record.price = updates.price
  record.purchaseDate = updates.purchaseDate
  record.expirationDate = updates.expirationDate || undefined
  record.site = updates.site
  record.quantity = newTotalQuantity
  record.remainingQuantity = newRemainingQuantity

  // Handle unit or volume change
  if (currentStockEntry.unit !== updates.unit || currentStockEntry.volume !== updates.volume) {
    // Remove from current entry
    currentStockEntry.purchaseHistory.splice(recordIndex, 1)
    currentStockEntry.quantity -= oldRemainingQuantity

    // Add to new entry (matching new unit AND volume)
    let targetEntry = product.stockEntries.find(se => se.unit === updates.unit && se.volume === updates.volume)
    if (targetEntry) {
      targetEntry.purchaseHistory.push(record)
      targetEntry.quantity += newRemainingQuantity
    } else {
      product.stockEntries.push({
        unit: updates.unit,
        volume: updates.volume,
        quantity: newRemainingQuantity,
        purchaseHistory: [record]
      })
    }

    // Clean up empty entries
    if (currentStockEntry.purchaseHistory.length === 0) {
      const idx = product.stockEntries.findIndex(se => se.unit === currentStockEntry!.unit && se.volume === currentStockEntry!.volume)
      if (idx !== -1) product.stockEntries.splice(idx, 1)
    }
  } else {
    // Same unit and volume, just adjust entry quantity
    currentStockEntry.quantity = currentStockEntry.quantity - oldRemainingQuantity + newRemainingQuantity
  }

  if (!data.categories.includes(updates.category)) {
    data.categories.push(updates.category)
  }

  product.updatedAt = new Date().toISOString()
  saveInventoryData(data)
  return product
}

// Get total count of products (based on current quantity / volume)
export function getTotalCount(product: Product): number {
  return product.stockEntries.reduce((sum, entry) => {
    // Calculate current count from total quantity / volume per item
    // Use Math.ceil to treat partially used items as 1 in the total count
    return sum + Math.ceil(entry.quantity / entry.volume)
  }, 0)
}

// Get total quantity across all units (for main page display)
function getTotalQuantity(product: Product): number {
  return product.stockEntries.reduce((sum, entry) => sum + entry.quantity, 0)
}

// Get lowest price across all purchase history
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

// Get lowest price with site info
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
  return { price: lowestRecord.price, site: lowestRecord.site }
}

// Get latest purchase date
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

// Get total purchase value (sum of price * original count)
export function getTotalPurchaseValue(product: Product): number {
  return product.stockEntries.reduce((sum, entry) => {
    return sum + entry.purchaseHistory.reduce((innerSum, record) => {
      return innerSum + (record.price * record.count)
    }, 0)
  }, 0)
}

// Get latest price
function getLatestPrice(product: Product): number | null {
  let latestRecord: PurchaseRecord | null = null
  
  product.stockEntries.forEach(entry => {
    entry.purchaseHistory.forEach(record => {
      if (!latestRecord || new Date(record.purchaseDate) > new Date(latestRecord.purchaseDate)) {
        latestRecord = record
      }
    })
  })
  
  return latestRecord ? latestRecord.price : null
}

export function getStats(products: Product[]) {
  const totalProducts = products.length
  const totalValue = products.reduce((sum, product) => {
    const latestPrice = getLatestPrice(product) || 0
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
