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
  uploadProductImage,
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
    async function init() {
      const data = await getInventoryData()
      setCategories(data.categories)

      if (productId) {
        const p = await getProductById(productId)
        if (p) {
          setExistingProduct(p)
          if (editRecordId) {
            const r = getPurchaseRecordById(p, editRecordId)
            if (r) setEditingRecord(r)
          }
        }
      }
      setIsLoading(false)
    }
    init()
  }, [productId, editRecordId])

  const handleSave = async (data: {
    productName: string
    category: string
    unit: Unit
    volume: number
    price: number
    purchaseDate: string
    expirationDate?: string
    site: string
    batches: { count: number; expirationDate?: string }[]
    imageFile?: File
    memo?: string
  }) => {
    let imageUrl = undefined
    if (data.imageFile) {
      imageUrl = await uploadProductImage(data.imageFile) || undefined
    }

    if (editingRecord && existingProduct) {
      await updatePurchaseRecord(existingProduct.id, editingRecord.id, {
        productName: data.productName,
        category: data.category,
        unit: data.unit,
        count: data.batches[0].count,
        volume: data.volume,
        price: data.price,
        purchaseDate: data.purchaseDate,
        expirationDate: data.expirationDate,
        site: data.site,
        imageUrl: imageUrl,
        memo: data.memo,
      })
      router.push(`/product/${existingProduct.id}`)
    } else {
      let firstProductId = ''
      for (let i = 0; i < data.batches.length; i++) {
        const batch = data.batches[i]
        const p = await addPurchaseToProduct(
          data.productName,
          data.category,
          data.unit,
          batch.count,
          data.volume,
          data.price,
          data.purchaseDate,
          data.site,
          batch.expirationDate,
          imageUrl,
          data.memo
        )
        if (i === 0 && p) firstProductId = p.id
      }
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
      key={editRecordId || 'new'}
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
