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
  cancelUsage,
  getInventoryData,
  updateProductSettings,
} from '@/lib/inventory-store'

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const { id } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProduct = async () => {
    const p = await getProductById(id)
    if (!p) {
      router.push('/')
      return
    }
    setProduct(p)
  }

  useEffect(() => {
    async function init() {
      await refreshProduct()
      setIsLoading(false)
    }
    init()
  }, [id])

  const handleDeleteProduct = async () => {
    if (product) {
      await deleteProduct(product.id)
      router.push('/')
    }
  }

  const handleDeletePurchaseRecord = async (unit: Unit, volume: number, recordId: string) => {
    if (product) {
      const updated = await deletePurchaseRecord(product.id, unit, volume, recordId)
      if (updated) {
        setProduct(updated)
      } else {
        router.push('/')
      }
    }
  }

  const handleUseProduct = async (unit: Unit, volume: number, quantityToUse: number, recordId?: string) => {
    if (product) {
      const updated = await useProduct(product.id, unit, volume, quantityToUse, recordId)
      setProduct(updated)

      toast({
        title: '재고 사용됨',
        description: `${product.name} 재고가 차감되었습니다.`,
      })
    }
  }

  const handleCancelUsage = async (usageId: string) => {
    if (product) {
      const updated = await cancelUsage(product.id, usageId)
      setProduct(updated)

      toast({
        title: '사용 취소됨',
        description: '제품 사용 기록이 취소되고 재고가 복구되었습니다.',
      })
    }
  }

  const handleUpdateStock = async (unit: Unit, volume: number, newQuantity: number) => {
    if (product) {
      const updated = await updateStockQuantity(product.id, unit, volume, newQuantity)
      if (updated) setProduct(updated)
    }
  }

  const handleUpdateSettings = async (settings: { isHidden?: boolean; ignoreOutOfStock?: boolean }) => {
    if (product) {
      const updated = await updateProductSettings(product.id, settings)
      if (updated) setProduct(updated)
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
        onCancelUsage={handleCancelUsage}
        onAddPurchase={handleAddPurchase}
        onUpdateSettings={handleUpdateSettings}
      />
    </MobileContainer>
  )
}
