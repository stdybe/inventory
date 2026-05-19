'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ProductDetail } from '@/components/inventory/product-detail'
import { MobileContainer } from '@/components/inventory/mobile-container'
import { useToast } from '@/hooks/use-toast'
import {
  Product,
  Unit,
  getProductById,
  deleteProduct,
  deletePurchaseRecord,
  updateStockQuantity,
  useProduct,
  getInventoryData,
} from '@/lib/inventory-store'

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const { id } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProduct = () => {
    const p = getProductById(id)
    if (!p) {
      router.push('/')
      return
    }
    setProduct(p)
  }

  useEffect(() => {
    refreshProduct()
    setIsLoading(false)
  }, [id])

  const handleDeleteProduct = () => {
    if (product) {
      deleteProduct(product.id)
      router.push('/')
    }
  }

  const handleDeletePurchaseRecord = (unit: Unit, volume: number, recordId: string) => {
    if (product) {
      const updated = deletePurchaseRecord(product.id, unit, volume, recordId)
      if (updated) {
        refreshProduct()
      } else {
        router.push('/')
      }
    }
  }

  const handleUpdateStock = (unit: Unit, volume: number, newQuantity: number) => {
    if (product) {
      updateStockQuantity(product.id, unit, volume, newQuantity)
      refreshProduct()
    }
  }

  const handleUseProduct = (unit: Unit, volume: number, quantityToUse: number) => {
    if (product) {
      useProduct(product.id, unit, volume, quantityToUse)
      refreshProduct()

      toast({
        title: '재고 사용됨',
        description: `${product.name} 재고가 차감되었습니다.`,
      })
    }
  }

  const handleEditPurchaseRecord = (record: any) => {
    router.push(`/purchase?editRecordId=${record.id}&productId=${id}`)
  }

  const handleAddPurchase = () => {
    router.push(`/purchase?productId=${id}`)
  }

  if (isLoading) {
    return (
      <MobileContainer>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </MobileContainer>
    )
  }

  if (!product) return null

  return (
    <MobileContainer>
      <ProductDetail
        product={product}
        onClose={() => router.push('/')}
        onDeleteProduct={handleDeleteProduct}
        onDeletePurchaseRecord={handleDeletePurchaseRecord}
        onEditPurchaseRecord={handleEditPurchaseRecord}
        onUpdateStock={handleUpdateStock}
        onUseProduct={handleUseProduct}
        onAddPurchase={handleAddPurchase}
      />
    </MobileContainer>
  )
}
