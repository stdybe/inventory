'use client'

import { useState, useEffect } from 'react'
import { Product, UNITS, Unit, PURCHASE_SITES, searchProductsByName, PurchaseRecord } from '@/lib/inventory-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Check, Plus } from 'lucide-react'
import { DatePicker } from './date-picker'

interface PurchaseBatch {
  id: string
  count: string
  expirationDate?: Date
}

interface PurchaseFormProps {
  existingProduct?: Product | null
  editingRecord?: PurchaseRecord | null
  categories: string[]
  onSave: (data: {
    productName: string
    category: string
    unit: Unit
    volume: number
    price: number
    purchaseDate: string
    expirationDate?: string // for editing existing single record
    site: string
    batches: { count: number; expirationDate?: string }[]
  }) => void
  onClose: () => void
}

export function PurchaseForm({ existingProduct, editingRecord, categories, onSave, onClose }: PurchaseFormProps) {
  const [productName, setProductName] = useState(existingProduct?.name || '')
  const [category, setCategory] = useState(existingProduct?.category || '')
  const [unit, setUnit] = useState<Unit>(editingRecord?.unit || 'pcs')
  
  // Batches for multiple expiration dates
  const [batches, setBatches] = useState<PurchaseBatch[]>(() => {
    if (editingRecord) {
      return [{ 
        id: '1', 
        count: editingRecord.count.toString(), 
        expirationDate: editingRecord.expirationDate ? new Date(editingRecord.expirationDate) : undefined 
      }]
    }
    return [{ id: '1', count: '1', expirationDate: undefined }]
  })

  const [volume, setVolume] = useState(() => {
    if (!editingRecord) return ''
    if (editingRecord.volume === 1 && editingRecord.unit === 'pcs') return ''
    return editingRecord.volume.toString()
  })
  const [price, setPrice] = useState(editingRecord?.price.toString() || '')
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    editingRecord ? new Date(editingRecord.purchaseDate) : new Date()
  )

  // Initialize site-related states correctly from props
  const [site, setSite] = useState(() => {
    let initialSite = editingRecord?.site || ''
    if (!initialSite && existingProduct) {
      const allRecords = existingProduct.stockEntries.flatMap(se => se.purchaseHistory)
      const latestRecord = allRecords.sort((a, b) => 
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
      )[0]
      initialSite = latestRecord?.site || ''
    }
    return PURCHASE_SITES.includes(initialSite as any) ? initialSite : ''
  })
  
  const [customSite, setCustomSite] = useState(() => {
    let initialSite = editingRecord?.site || ''
    if (!initialSite && existingProduct) {
      const allRecords = existingProduct.stockEntries.flatMap(se => se.purchaseHistory)
      const latestRecord = allRecords.sort((a, b) => 
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
      )[0]
      initialSite = latestRecord?.site || ''
    }
    return PURCHASE_SITES.includes(initialSite as any) ? '' : initialSite
  })

  const [isCustomSite, setIsCustomSite] = useState(() => {
    let initialSite = editingRecord?.site || ''
    if (!initialSite && existingProduct) {
      const allRecords = existingProduct.stockEntries.flatMap(se => se.purchaseHistory)
      const latestRecord = allRecords.sort((a, b) => 
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
      )[0]
      initialSite = latestRecord?.site || ''
    }
    return initialSite !== '' && !PURCHASE_SITES.includes(initialSite as any)
  })

  const [showVolumeInput, setShowVolumeInput] = useState(editingRecord?.unit !== 'pcs' && !!editingRecord)
  
  // Product search suggestions
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedExisting, setSelectedExisting] = useState<Product | null>(existingProduct || null)

  useEffect(() => {
    // Ensure category is set if existingProduct is provided later
    if (existingProduct && !category) {
      setCategory(existingProduct.category)
      setProductName(existingProduct.name)
      setSelectedExisting(existingProduct)
    }
  }, [existingProduct, category])

  const handleProductNameChange = (value: string) => {
    setProductName(value)
    setSelectedExisting(null)
    
    if (value.trim().length >= 1) {
      const results = searchProductsByName(value)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (product: Product) => {
    setProductName(product.name)
    setCategory(product.category)
    setSelectedExisting(product)
    setSuggestions([])
    setShowSuggestions(false)

    // Pre-fill site from latest purchase of the selected product
    const allRecords = product.stockEntries.flatMap(se => se.purchaseHistory)
    const latestRecord = allRecords.sort((a, b) => 
      new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    )[0]

    if (latestRecord) {
      const recordSite = latestRecord.site || ''
      const isKnownSite = recordSite && PURCHASE_SITES.includes(recordSite as any)
      if (isKnownSite) {
        setSite(recordSite)
        setIsCustomSite(false)
      } else {
        setIsCustomSite(true)
        setCustomSite(recordSite)
      }
    }
  }

  const handleSiteChange = (value: string) => {
    if (value === '__custom__') {
      setIsCustomSite(true)
      setSite('')
    } else {
      setIsCustomSite(false)
      setSite(value)
      setCustomSite('')
    }
  }

  const addBatch = () => {
    setBatches([...batches, { id: Math.random().toString(36).substring(7), count: '1', expirationDate: undefined }])
  }

  const removeBatch = (id: string) => {
    if (batches.length > 1) {
      setBatches(batches.filter(b => b.id !== id))
    }
  }

  const updateBatch = (id: string, updates: Partial<PurchaseBatch>) => {
    setBatches(batches.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!purchaseDate) return

    const finalSite = isCustomSite ? customSite : site

    onSave({
      productName,
      category,
      unit,
      volume: parseFloat(volume) || 1,
      price: parseFloat(price) || 0,
      purchaseDate: purchaseDate.toISOString(),
      expirationDate: batches[0].expirationDate?.toISOString(),
      site: finalSite,
      batches: batches.map(b => ({
        count: parseFloat(b.count) || 0,
        expirationDate: b.expirationDate?.toISOString(),
      }))
    })
  }

  const finalSite = isCustomSite ? customSite : site
  const isValid = 
    productName.trim() !== '' && 
    category.trim() !== '' && 
    batches.every(b => b.count.trim() !== '' && parseFloat(b.count) > 0) &&
    price.trim() !== '' && 
    purchaseDate !== undefined

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-4">
          <button onClick={onClose} className="p-1">
            <X className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">
            {editingRecord ? '구매 이력 수정' : '구매 등록'}
          </h1>
          <div className="w-8" />
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-4 p-4">
            {/* Product Name with Search */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="productName">상품명</Label>
              <div className="relative">
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => handleProductNameChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="상품명을 입력하세요"
                  className="bg-card"
                />
                {selectedExisting && !existingProduct && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-1 text-xs text-accent">
                      <Check className="h-3 w-3" />
                      <span>기존 상품</span>
                    </div>
                  </div>
                )}
                
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && !existingProduct && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                    {suggestions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(product)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-secondary"
                      >
                        <span className="font-medium text-foreground">{product.name}</span>
                        <span className="text-xs text-muted-foreground">{product.category}</span>
                      </button>
                    ))}
                    <div className="border-t border-border px-3 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExisting(null)
                          setShowSuggestions(false)
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        새 상품으로 등록
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {selectedExisting && !existingProduct && (
                <p className="text-xs text-muted-foreground">
                  이 구매 기록은 기존 상품에 추가됩니다
                </p>
              )}
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">카테고리</Label>
              <Select 
                value={category} 
                onValueChange={setCategory}
              >
                <SelectTrigger className="w-full bg-card">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purchase Date */}
            <div className="flex flex-col gap-2">
              <Label>구매일</Label>
              <DatePicker
                date={purchaseDate}
                onDateChange={setPurchaseDate}
              />
            </div>

            {/* Purchase Site */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="site">구매처</Label>
              {isCustomSite ? (
                <div className="flex gap-2">
                  <Input
                    id="customSite"
                    value={customSite}
                    onChange={(e) => setCustomSite(e.target.value)}
                    placeholder="구매처를 입력하세요"
                    className="flex-1 bg-card"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCustomSite(false)
                      setCustomSite('')
                    }}
                  >
                    목록
                  </Button>
                </div>
              ) : (
                <Select value={site} onValueChange={handleSiteChange}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="구매처 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {PURCHASE_SITES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">직접 입력</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Batches (Count and Expiration Date) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label>수량 및 소비기한</Label>
                {!editingRecord && (
                  <Button type="button" variant="ghost" size="sm" onClick={addBatch} className="h-8 text-primary">
                    <Plus className="h-4 w-4 mr-1" />
                    추가
                  </Button>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                {batches.map((batch) => (
                  <div key={batch.id} className="relative rounded-xl border border-border bg-card p-3">
                    {batches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBatch(batch.id)}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm z-10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`count-${batch.id}`} className="text-xs text-muted-foreground">수량</Label>
                        <Input
                          id={`count-${batch.id}`}
                          type="number"
                          value={batch.count}
                          onChange={(e) => updateBatch(batch.id, { count: e.target.value })}
                          placeholder="1"
                          min="1"
                          className="h-9"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">소비기한 (선택)</Label>
                        <DatePicker
                          date={batch.expirationDate}
                          onDateChange={(date) => updateBatch(batch.id, { expirationDate: date })}
                          placeholder="선택 안 함"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume and Unit Toggle */}
            <div className="flex flex-col gap-3">
              {!showVolumeInput ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-fit border-dashed"
                  onClick={() => {
                    setShowVolumeInput(true)
                    setUnit('ml') // Default to ml when showing
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  용량/단위 정보 추가 (선택)
                </Button>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-3 flex flex-col gap-3 bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">용량 및 단위</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setShowVolumeInput(false)
                        setVolume('')
                        setUnit('pcs')
                      }}
                    >
                      취소
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="volume" className="text-xs text-muted-foreground">개당 용량</Label>
                      <Input
                        id="volume"
                        type="number"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        placeholder="예: 500"
                        min="0"
                        step="0.01"
                        className="bg-card"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="unit" className="text-xs text-muted-foreground">단위</Label>
                      <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
                        <SelectTrigger className="w-full bg-card">
                          <SelectValue placeholder="단위" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">개당 가격 (원)</Label>
              <Input
                id="price"
                type="number"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                className="bg-card"
              />
            </div>
          </div>

          <div className="mt-auto border-t border-border p-4">
            <Button type="submit" disabled={!isValid} className="w-full">
              {editingRecord ? '수정 완료' : (selectedExisting || existingProduct ? '기존 상품에 추가' : '상품 등록')}
            </Button>
          </div>
        </form>
      </div>
    )
  }
