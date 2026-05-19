'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MobileContainer } from '@/components/inventory/mobile-container'
import { StatsCards } from '@/components/inventory/stats-cards'
import { ProductList } from '@/components/inventory/product-list'
import { PurchaseForm } from '@/components/inventory/purchase-form'
import { ProductDetail } from '@/components/inventory/product-detail'
import { SearchFilter } from '@/components/inventory/search-filter'
import { useToast } from '@/hooks/use-toast'
import {
  Product,
  Unit,
  PurchaseRecord,
  getInventoryData,
  addPurchaseToProduct,
  updatePurchaseRecord,
  deleteProduct,
  deletePurchaseRecord,
  updateStockQuantity,
  useProduct,
  getStats,
  getTotalCount,
} from '@/lib/inventory-store'

export default function InventoryPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [addingToProduct, setAddingToProduct] = useState<Product | null>(null)
  const [editingRecord, setEditingRecord] = useState<PurchaseRecord | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  const refreshData = () => {
    const data = getInventoryData()
    setProducts(data.products)
    setCategories(data.categories)
  }

  useEffect(() => {
    refreshData()
    setIsLoading(false)
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory

      const totalQty = getTotalCount(product)
      let matchesStock = true
      if (stockFilter === 'in-stock') {
        matchesStock = totalQty > 0
      } else if (stockFilter === 'out-of-stock') {
        matchesStock = totalQty === 0
      }

      return matchesSearch && matchesCategory && matchesStock
    })
  }, [products, searchQuery, selectedCategory, stockFilter])

  const stats = useMemo(() => getStats(products), [products])

  const handleSavePurchase = (data: {
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
    if (editingRecord && selectedProduct) {
      updatePurchaseRecord(selectedProduct.id, editingRecord.id, {
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
    } else {
      // Add each batch as a separate purchase record
      data.batches.forEach(batch => {
        addPurchaseToProduct(
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
      })
    }
    refreshData()
    setShowPurchaseForm(false)
    setAddingToProduct(null)
    setEditingRecord(null)
    
    // Refresh selected product if we were editing
    if (selectedProduct) {
      const freshData = getInventoryData()
      const freshProduct = freshData.products.find(p => p.id === selectedProduct.id)
      setSelectedProduct(freshProduct || null)
    }
  }

  const handleDeleteProduct = () => {
    if (selectedProduct) {
      deleteProduct(selectedProduct.id)
      refreshData()
      setSelectedProduct(null)
    }
  }

  const handleDeletePurchaseRecord = (unit: Unit, volume: number, recordId: string) => {
    if (selectedProduct) {
      const updated = deletePurchaseRecord(selectedProduct.id, unit, volume, recordId)
      refreshData()
      if (updated) {
        // Update the selected product with fresh data
        const freshData = getInventoryData()
        const freshProduct = freshData.products.find(p => p.id === selectedProduct.id)
        setSelectedProduct(freshProduct || null)
      } else {
        // Product was deleted (no more stock entries)
        setSelectedProduct(null)
      }
    }
  }

  const handleUpdateStock = (unit: Unit, volume: number, newQuantity: number) => {
    if (selectedProduct) {
      updateStockQuantity(selectedProduct.id, unit, volume, newQuantity)
      refreshData()
      // Update selected product with fresh data
      const freshData = getInventoryData()
      const freshProduct = freshData.products.find(p => p.id === selectedProduct.id)
      setSelectedProduct(freshProduct || null)
    }
  }

  const handleUseProduct = (unit: Unit, volume: number, quantityToUse: number) => {
    if (selectedProduct) {
      useProduct(selectedProduct.id, unit, volume, quantityToUse)
      refreshData()
      // Update selected product with fresh data
      const freshData = getInventoryData()
      const freshProduct = freshData.products.find(p => p.id === selectedProduct.id)
      setSelectedProduct(freshProduct || null)

      toast({
        title: '재고 사용됨',
        description: `${selectedProduct.name} 재고가 차감되었습니다.`,
      })
    }
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleAddNew = () => {
    setAddingToProduct(null)
    setShowPurchaseForm(true)
  }

  const handleAddPurchaseToProduct = () => {
    if (selectedProduct) {
      setAddingToProduct(selectedProduct)
      setEditingRecord(null)
      setShowPurchaseForm(true)
    }
  }

  const handleEditPurchaseRecord = (record: PurchaseRecord) => {
    setEditingRecord(record)
    setAddingToProduct(selectedProduct)
    setShowPurchaseForm(true)
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

  return (
    <MobileContainer>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Inventory</h1>
            </div>
            <Button size="icon" onClick={handleAddNew}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-4">
          <div className="flex flex-col gap-6">
            <StatsCards
              totalProducts={stats.totalProducts}
              outOfStockCount={stats.outOfStockCount}
            />

            <SearchFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              stockFilter={stockFilter}
              onStockFilterChange={setStockFilter}
            />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">
                  상품 목록 ({filteredProducts.length})
                </h2>
              </div>
              <ProductList products={filteredProducts} onProductClick={handleProductClick} />
            </div>
          </div>
        </main>

        {showPurchaseForm && (
          <PurchaseForm
            existingProduct={addingToProduct}
            editingRecord={editingRecord}
            categories={categories}
            onSave={handleSavePurchase}
            onClose={() => {
              setShowPurchaseForm(false)
              setAddingToProduct(null)
              setEditingRecord(null)
            }}
          />
        )}

        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onDeleteProduct={handleDeleteProduct}
            onDeletePurchaseRecord={handleDeletePurchaseRecord}
            onEditPurchaseRecord={handleEditPurchaseRecord}
            onUpdateStock={handleUpdateStock}
            onUseProduct={handleUseProduct}
            onAddPurchase={handleAddPurchaseToProduct}
          />
        )}
      </div>
    </MobileContainer>
  )
}
