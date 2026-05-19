'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X, Trash2, TrendingDown, Package, ChevronDown, ChevronUp, Plus, Pencil, Minus, CalendarX } from 'lucide-react'
import { Product, StockEntry, Unit, UNITS, getLowestPrice, getLastPurchaseDate, getTotalPurchaseValue, getTotalCount, PurchaseRecord, getUnitLabel } from '@/lib/inventory-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ProductDetailProps {
  product: Product
  onClose: () => void
  onDeleteProduct: () => void
  onDeletePurchaseRecord: (unit: Unit, volume: number, recordId: string) => void
  onEditPurchaseRecord: (record: PurchaseRecord) => void
  onUpdateStock: (unit: Unit, volume: number, newQuantity: number) => void
  onUseProduct: (unit: Unit, volume: number, quantityToUse: number) => void
  onAddPurchase: () => void
}

export function ProductDetail({
  product,
  onClose,
  onDeleteProduct,
  onDeletePurchaseRecord,
  onEditPurchaseRecord,
  onUpdateStock,
  onUseProduct,
  onAddPurchase,
}: ProductDetailProps) {
  const [expandedUnits, setExpandedUnits] = useState<string>('')
  const [editingStock, setEditingStock] = useState<{ unit: Unit; volume: number; value: string } | null>(null)

  const lowestPrice = getLowestPrice(product)
  const lastPurchaseDate = getLastPurchaseDate(product)
  const totalPurchaseValue = getTotalPurchaseValue(product)
  const totalCount = getTotalCount(product)

  const getEntryKey = (unit: Unit, volume: number) => `${unit}-${volume}`

  const toggleExpand = (unit: Unit, volume: number) => {
    const key = getEntryKey(unit, volume)
    setExpandedUnits(expandedUnits === key ? '' : key)
  }

  const handleStockEdit = (entry: StockEntry) => {
    setEditingStock({ unit: entry.unit, volume: entry.volume, value: entry.quantity.toString() })
  }

  const handleStockSave = (unit: Unit, volume: number) => {
    if (editingStock) {
      const newQuantity = parseFloat(editingStock.value) || 0
      onUpdateStock(unit, volume, newQuantity)
      setEditingStock(null)
    }
  }

  const formatQuantity = (quantity: number): string => {
    return Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(2)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-4">
          <button onClick={onClose} className="p-1">
            <X className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">상품 상세</h1>
          <div className="w-8" />
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Product Header */}
          <div className="border-b border-border p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">{product.name}</h2>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-card p-3">
                <p className="text-xs text-muted-foreground">총 재고</p>
                <p className="text-lg font-semibold text-foreground">{totalCount}개</p>
              </div>
              <div className="rounded-lg bg-card p-3">
                <p className="text-xs text-muted-foreground">최저 단가</p>
                <p className="text-lg font-semibold text-accent flex items-center gap-1">
                  {lowestPrice ? (
                    <>
                      <TrendingDown className="h-4 w-4" />
                      {lowestPrice.toLocaleString('ko-KR')}원
                    </>
                  ) : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-card p-3">
                <p className="text-xs text-muted-foreground">마지막 구매일</p>
                <p className="text-lg font-semibold text-foreground">
                  {lastPurchaseDate ? format(new Date(lastPurchaseDate), 'yy.MM.dd') : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-card p-3">
                <p className="text-xs text-muted-foreground">누적 구매총액</p>
                <p className="text-lg font-semibold text-foreground">
                  {totalPurchaseValue.toLocaleString('ko-KR')}원
                </p>
              </div>
            </div>
          </div>

          {/* Stock by Unit */}
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-foreground">용량별 재고</h3>
              <Button variant="outline" size="sm" onClick={onAddPurchase}>
                <Plus className="h-4 w-4 mr-1" />
                구매 추가
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {product.stockEntries.map((entry) => {
                const entryKey = getEntryKey(entry.unit, entry.volume)
                const isExpanded = expandedUnits === entryKey
                const unitLabel = getUnitLabel(entry.unit)
                const entryLowest = entry.purchaseHistory.length > 0
                  ? Math.min(...entry.purchaseHistory.map(r => r.price))
                  : null
                
                const currentCount = Math.ceil(entry.quantity / entry.volume)

                return (
                  <div key={entryKey} className="rounded-xl bg-card overflow-hidden">
                    {/* Unit Header */}
                    <button
                      onClick={() => toggleExpand(entry.unit, entry.volume)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{unitLabel}</Badge>
                        <div className="flex items-center gap-4">
                          {editingStock?.unit === entry.unit && editingStock?.volume === entry.volume ? (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <Input
                                type="number"
                                value={editingStock.value}
                                onChange={(e) => setEditingStock({ ...editingStock, value: e.target.value })}
                                className="h-8 w-24 bg-secondary"
                                step="0.01"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStockSave(entry.unit, entry.volume)}
                              >
                                저장
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStockEdit(entry)
                              }}
                              className="text-lg font-semibold text-foreground hover:text-primary"
                            >
                              {entry.unit === 'pcs' ? (
                                `${currentCount}개`
                              ) : (
                                `${formatQuantity(entry.volume)}${unitLabel} (${currentCount}개)`
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    {/* Purchase History */}
                    {isExpanded && (
                      <div className="border-t border-border px-4 pb-4">
                        <p className="py-3 text-sm font-medium text-muted-foreground">
                          구매 내역 ({entry.purchaseHistory.length})
                        </p>
                        <div className="flex flex-col gap-2">
                          {[...entry.purchaseHistory]
                            .sort((a, b) => {
                              // If both have expiration dates, sort by expiration date (earliest first)
                              if (a.expirationDate && b.expirationDate) {
                                const expDiff = new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
                                if (expDiff !== 0) return expDiff
                              }
                              // If only one has an expiration date, show the one with expiration date first
                              if (a.expirationDate && !b.expirationDate) return -1
                              if (!a.expirationDate && b.expirationDate) return 1
                              
                              // If neither has expiration date or expiration dates are same, sort by purchase date (earliest first)
                              return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
                            })
                            .map((record) => {
                              const recordUnitLabel = getUnitLabel(record.unit)
                              const isConsumed = record.remainingQuantity <= 0
                              const currentRecordCount = Math.ceil(record.remainingQuantity / record.volume)
                              
                              return (
                                <div
                                  key={record.id}
                                  className={`flex items-center justify-between rounded-lg p-3 ${
                                    isConsumed ? 'bg-secondary/50 opacity-60' : 'bg-secondary'
                                  } ${
                                    record.price === entryLowest && !isConsumed ? 'ring-1 ring-accent' : ''
                                  }`}
                                >
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-medium ${
                                        record.price === entryLowest && !isConsumed ? 'text-accent' : 'text-foreground'
                                      } ${isConsumed ? 'line-through text-muted-foreground' : ''}`}>
                                        {record.price.toLocaleString('ko-KR')}원
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        {record.unit === 'pcs' && record.volume === 1 ? (
                                          <>
                                            {isConsumed ? (
                                              <span>소진됨 ({record.count}개)</span>
                                            ) : (
                                              <span>{currentRecordCount} / {record.count}개</span>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            {isConsumed ? (
                                              <span>소진됨 ({record.count}개 x {formatQuantity(record.volume)}{recordUnitLabel})</span>
                                            ) : (
                                              <span>{currentRecordCount} / {record.count}개 ({formatQuantity(record.volume)}{recordUnitLabel})</span>
                                            )}
                                          </>
                                        )}
                                      </span>
                                      {record.price === entryLowest && !isConsumed && (
                                        <Badge variant="secondary" className="text-xs text-accent">
                                          최저가
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{format(new Date(record.purchaseDate), 'yyyy년 M월 d일', { locale: ko })}</span>
                                      {record.expirationDate && (
                                        <>
                                          <span>·</span>
                                          <span className="flex items-center gap-1 text-orange-500 font-medium">
                                            <CalendarX className="h-3 w-3" />
                                            ~{format(new Date(record.expirationDate), 'yy.MM.dd')}
                                          </span>
                                        </>
                                      )}
                                      {record.site && (
                                        <>
                                          <span>·</span>
                                          <span>{record.site}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {!isConsumed && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-primary hover:bg-primary/10"
                                        onClick={() => onUseProduct(record.unit, record.volume, record.volume)}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                                      onClick={() => onEditPurchaseRecord(record)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>구매 기록 삭제</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          이 구매 기록을 삭제하면 재고에서 {formatQuantity(record.remainingQuantity)} {recordUnitLabel}가 차감됩니다.
                                        </AlertDialogDescription>                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>취소</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => onDeletePurchaseRecord(record.unit, record.volume, record.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          삭제
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Delete Product Button */}
        <div className="border-t border-border p-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                상품 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>상품 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{product.name}&quot; 상품과 모든 구매 기록이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteProduct}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
