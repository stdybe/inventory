'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MobileContainer } from '@/components/inventory/mobile-container'
import { StatsCards } from '@/components/inventory/stats-cards'
import { ProductList } from '@/components/inventory/product-list'
import { SearchFilter } from '@/components/inventory/search-filter'
import {
  Product,
  getInventoryData,
  getStats,
  getTotalCount,
} from '@/lib/inventory-store'

export default function InventoryPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  useEffect(() => {
    const data = getInventoryData()
    setProducts(data.products)
    setCategories(data.categories)
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

  const handleProductClick = (product: Product) => {
    router.push(`/product/${product.id}`)
  }

  const handleAddNew = () => {
    router.push('/purchase')
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
        </div>
      </MobileContainer>
  )
}
