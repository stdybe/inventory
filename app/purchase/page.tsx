'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PurchaseForm } from '@/components/inventory/purchase-form'
import { MobileContainer } from '@/components/inventory/mobile-container'
import {
  Product,
  PurchaseRecord,
  Unit,
  getInventoryData,
  getProductById,
  getPurchaseRecordById,
  addPurchaseToProduct,
  updatePurchaseRecord,
} from '@/lib/inventory-store'

function PurchaseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const editRecordId = searchParams.get('editRecordId')

  const [categories, setCategories] = useState<string[]>([])
  const [existingProduct, setExistingProduct] = useState<Product | null>(null)
  const [editingRecord, setEditingRecord] = useState<PurchaseRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const data = getInventoryData()
    setCategories(data.categories)

    if (productId) {
      const p = getProductById(productId)
      if (p) {
        setExistingProduct(p)
        if (editRecordId) {
          const r = getPurchaseRecordById(productId, editRecordId)
          if (r) setEditingRecord(r)
        }
      }
    }
    setIsLoading(false)
  }, [productId, editRecordId])

  const handleSave = (data: {
    productName: string
    category: string
    unit: Unit
    volume: number
    price: number
    purchaseDate: string
    expirationDate?: string
    site: string
    batches: { count: number; expirationDate?: string }[]
  }) => {
    if (editingRecord && existingProduct) {
      updatePurchaseRecord(existingProduct.id, editingRecord.id, {
        productName: data.productName,
        category: data.category,
        unit: data.unit,
        count: data.batches[0].count,
        volume: data.volume,
        price: data.price,
        purchaseDate: data.purchaseDate,
        expirationDate: data.expirationDate,
        site: data.site,
      })
      router.push(`/product/${existingProduct.id}`)
    } else {
      let firstProductId = ''
      data.batches.forEach((batch, index) => {
        const p = addPurchaseToProduct(
          data.productName,
          data.category,
          data.unit,
          batch.count,
          data.volume,
          data.price,
          data.purchaseDate,
          data.site,
          batch.expirationDate
        )
        if (index === 0) firstProductId = p.id
      })
      router.push(firstProductId ? `/product/${firstProductId}` : '/')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <PurchaseForm
      existingProduct={existingProduct}
      editingRecord={editingRecord}
      categories={categories}
      onSave={handleSave}
      onClose={() => router.back()}
    />
  )
}

export default function PurchasePage() {
  return (
    <MobileContainer>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        <PurchaseContent />
      </Suspense>
    </MobileContainer>
  )
}
