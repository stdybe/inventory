'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface SearchFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  categories: string[]
  stockFilter: string
  onStockFilterChange: (filter: string) => void
  showHiddenFilter: string
  onShowHiddenChange: (filter: string) => void
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  stockFilter,
  onStockFilterChange,
  showHiddenFilter,
  onShowHiddenChange,
}: SearchFilterProps) {
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = selectedCategory !== 'all' || stockFilter !== 'all' || showHiddenFilter !== 'visible'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="상품 검색..."
            className="bg-card pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={hasActiveFilters ? 'default' : 'secondary'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="flex-shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="flex-1 bg-card">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={onStockFilterChange}>
              <SelectTrigger className="flex-1 bg-card">
                <SelectValue placeholder="재고 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 재고</SelectItem>
                <SelectItem value="in-stock">재고 있음</SelectItem>
                <SelectItem value="out-of-stock">소진</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={showHiddenFilter} onValueChange={onShowHiddenChange}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue placeholder="표시 설정" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visible">일반 상품만 보기</SelectItem>
              <SelectItem value="hidden">숨긴 상품만 보기</SelectItem>
              <SelectItem value="all">모든 상품 보기 (숨김 포함)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
