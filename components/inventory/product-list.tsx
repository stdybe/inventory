'use client'

import { Product, getLowestPriceWithSite, getLastPurchaseDate, getTotalPurchaseValue, getTotalCount } from '@/lib/inventory-store'
import { Package, ChevronRight, TrendingDown, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface ProductListProps {
  products: Product[]
  onProductClick: (product: Product) => void
}

export function ProductList({ products, onProductClick }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-card p-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">상품이 없습니다</p>
        <p className="text-sm text-muted-foreground">첫 번째 구매를 등록해 보세요</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {products.map((product) => {
        const lowestPriceInfo = getLowestPriceWithSite(product)
        const totalPurchaseValue = getTotalPurchaseValue(product)
        const lastPurchaseDate = getLastPurchaseDate(product)
        const totalCount = getTotalCount(product)
        const isOutOfStock = totalCount === 0

        return (
          <button
            key={product.id}
            onClick={() => onProductClick(product)}
            className="flex items-center gap-3 rounded-xl bg-card p-4 text-left transition-colors active:bg-secondary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-foreground truncate">{product.name}</p>
                {isOutOfStock && (
                  <Badge variant="destructive">소진</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{product.category}</span>
                <span>·</span>
                <span>총: {totalCount}개</span>
                {lastPurchaseDate && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(lastPurchaseDate), 'yy.MM.dd')}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm mt-1 flex-wrap">
                <span className="text-foreground font-medium">총 {totalPurchaseValue.toLocaleString('ko-KR')}원</span>
                {lowestPriceInfo && (
                  <span className="flex items-center gap-1 text-accent ml-auto">
                    <TrendingDown className="h-3 w-3" />
                    {lowestPriceInfo.price.toLocaleString('ko-KR')}원
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </button>
        )
      })}
    </div>
  )
}
