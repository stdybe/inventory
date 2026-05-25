'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X, Trash2, TrendingDown, Package, ChevronDown, ChevronUp, Plus, Pencil, Minus, CalendarX, EyeOff, Eye, BellOff, Bell, RotateCcw, History, Filter, List } from 'lucide-react'
import { Product, StockEntry, Unit, getLowestPriceInfo, getLastPurchaseDate, getTotalPurchaseValue, getTotalCount, PurchaseRecord, getUnitLabel, UsageRecord } from '@/lib/inventory-store'
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
  onUseProduct: (unit: Unit, volume: number, quantityToUse: number, recordId?: string) => void
  onCancelUsage: (usageId: string) => void
  onAddPurchase: () => void
  onUpdateSettings: (settings: { isHidden?: boolean; ignoreOutOfStock?: boolean }) => void
}

export function ProductDetail({
  product,
  onClose,
  onDeleteProduct,
  onDeletePurchaseRecord,
  onEditPurchaseRecord,
  onUpdateStock,
  onUseProduct,
  onCancelUsage,
  onAddPurchase,
  onUpdateSettings,
}: ProductDetailProps) {
  const [expandedUnits, setExpandedUnits] = useState<string>('')
  const [editingStock, setEditingStock] = useState<{ unit: Unit; volume: number; value: string } | null>(null)
  const [showUsageHistory, setShowUsageHistory] = useState(false)
  const [hideConsumed, setHideConsumed] = useState(true)

  const lowestPriceInfo = getLowestPriceInfo(product)
  const lastPurchaseDate = getLastPurchaseDate(product)
  const totalPurchaseValue = getTotalPurchaseValue(product)
  const totalCount = getTotalCount(product)

  const lastPurchaseDateObj = lastPurchaseDate ? new Date(lastPurchaseDate) : null
  const isLastPurchaseDateValid = lastPurchaseDateObj && !isNaN(lastPurchaseDateObj.getTime())

  const lastUsedAtObj = product.lastUsedAt ? new Date(product.lastUsedAt) : null
  const isLastUsedAtValid = lastUsedAtObj && !isNaN(lastUsedAtObj.getTime())

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

  const allPurchaseRecords = product.stockEntries.flatMap(e => e.purchaseHistory)
  const consumedPurchaseIds = new Set(
    allPurchaseRecords.filter(r => r.remainingQuantity <= 0).map(r => r.id)
  )

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-4">
          <button onClick={onClose} className="p-1">
            <X className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">상품 상세</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHideConsumed(!hideConsumed)}
              className={hideConsumed ? 'text-primary' : 'text-muted-foreground'}
              title={hideConsumed ? '모든 기록 보기' : '소진된 기록 숨기기'}
            >
              {hideConsumed ? <Filter className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUpdateSettings({ isHidden: !product.isHidden })}
              className={product.isHidden ? 'text-primary' : 'text-muted-foreground'}
              title={product.isHidden ? '숨김 해제' : '상품 숨기기'}
            >
              {product.isHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUpdateSettings({ ignoreOutOfStock: !product.ignoreOutOfStock })}
              className={product.ignoreOutOfStock ? 'text-primary' : 'text-muted-foreground'}
              title={product.ignoreOutOfStock ? '알람 켜기' : '소진 알람 끄기'}
            >
              {product.ignoreOutOfStock ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Product Header */}
          <div className="border-b border-border p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-primary">{product.category}</span>
                  {totalCount === 0 && (
                    <Badge variant={product.ignoreOutOfStock ? 'secondary' : 'destructive'}>
                      소진{product.ignoreOutOfStock && ' (알람끔)'}
                    </Badge>
                  )}
                  {product.isHidden && <Badge variant="secondary">숨김</Badge>}
                </div>
                <h1 className="text-2xl font-bold text-foreground mt-1">{product.name}</h1>
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
                <div className="text-lg font-semibold text-primary flex items-center gap-1">
                  {lowestPriceInfo ? (
                    <>
                      <TrendingDown className="h-4 w-4" />
                      <div className="flex flex-col leading-tight">
                        <span>{Math.round(lowestPriceInfo.normalizedPrice).toLocaleString('ko-KR')}원</span>
                        <span className="text-[10px] font-normal text-muted-foreground">({lowestPriceInfo.unitLabel})</span>
                      </div>
                    </>
                  ) : '-'}
                </div>
              </div>
              <div className="rounded-lg bg-card p-3">
                <p className="text-xs text-muted-foreground">마지막 구매일</p>
                <p className="text-lg font-semibold text-foreground">
                  {isLastPurchaseDateValid ? format(lastPurchaseDateObj, 'yy.MM.dd') : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-card p-3">
                <p className="text-xs text-muted-foreground">마지막 사용일</p>
                <p className="text-lg font-semibold text-foreground">
                  {isLastUsedAtValid ? format(lastUsedAtObj, 'yy.MM.dd') : '-'}
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
                  ? Math.min(...entry.purchaseHistory.filter(r => r.price > 0).map(r => r.price))
                  : null
                
                const currentCount = Math.ceil(entry.quantity / entry.volume)

                return (
                  <div key={entryKey} className="rounded-xl bg-card overflow-hidden">
                    {/* Unit Header */}
                    <div
                      onClick={() => toggleExpand(entry.unit, entry.volume)}
                      className="flex w-full items-center justify-between p-4 text-left cursor-pointer"
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
                    </div>

                    {/* Purchase History */}
                    {isExpanded && (
                      <div className="border-t border-border px-4 pb-4">
                        <div className="flex items-center justify-between py-3">
                          <p className="text-sm font-medium text-muted-foreground">
                            구매 내역 ({entry.purchaseHistory.filter(r => !hideConsumed || r.remainingQuantity > 0).length})
                          </p>
                          {hideConsumed && entry.purchaseHistory.some(r => r.remainingQuantity <= 0) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs text-primary"
                              onClick={() => setHideConsumed(false)}
                            >
                              소진된 {entry.purchaseHistory.filter(r => r.remainingQuantity <= 0).length}개 더보기
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {[...entry.purchaseHistory]
                            .filter(record => !hideConsumed || record.remainingQuantity > 0)
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
                                  className={`flex items-center justify-between rounded-lg p-3 transition-all ${
                                    isConsumed ? 'bg-secondary/50 opacity-60' : 'bg-secondary'
                                  } ${
                                    record.price === entryLowest && !isConsumed 
                                      ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10 shadow-sm' 
                                      : 'border border-transparent'
                                  }`}
                                >
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-semibold ${
                                        record.price === entryLowest && !isConsumed ? 'text-primary' : 'text-foreground'
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
                                        <Badge className="bg-primary text-primary-foreground hover:bg-primary border-none text-[10px] h-5 px-1.5 font-bold uppercase tracking-wider">
                                          Best
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
                                    {record.memo && (
                                      <div className="mt-1 text-xs text-muted-foreground bg-card/50 px-2 py-1 rounded">
                                        {record.memo}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {!isConsumed && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-primary hover:bg-primary/10"
                                        onClick={() => onUseProduct(record.unit, record.volume, record.volume, record.id)}
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

          {/* Usage History */}
          <div className="border-t border-border p-4">
            <button
              onClick={() => setShowUsageHistory(!showUsageHistory)}
              className="flex w-full items-center justify-between py-2 text-left"
            >
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium text-foreground">최근 사용 기록</h3>
              </div>
              {showUsageHistory ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {showUsageHistory && (
              <div className="mt-3 flex flex-col gap-2">
                {product.usageHistory.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">사용 기록이 없습니다.</p>
                ) : (
                  <>
                    {product.usageHistory
                      .filter(usage => !hideConsumed || !consumedPurchaseIds.has(usage.purchaseRecordId))
                      .map((usage) => {
                        const record = product.stockEntries
                          .flatMap(e => e.purchaseHistory)
                          .find(r => r.id === usage.purchaseRecordId)
                        
                        return (
                          <div key={usage.id} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {usage.quantity}{getUnitLabel(record?.unit || 'pcs')} 사용
                                </span>
                                {record && (
                                  <span className="text-xs text-muted-foreground">
                                    ({record.price.toLocaleString()}원 상품)
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(usage.usedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground hover:text-primary"
                              onClick={() => onCancelUsage(usage.id)}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              취소
                            </Button>
                          </div>
                        )
                      })}
                    {hideConsumed && product.usageHistory.some(usage => consumedPurchaseIds.has(usage.purchaseRecordId)) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => setHideConsumed(false)}
                      >
                        소진된 항목의 사용 기록 더보기
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
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
    )
  }
