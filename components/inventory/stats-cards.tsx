'use client'

import { Package, XCircle } from 'lucide-react'

interface StatsCardsProps {
  totalProducts: number
  outOfStockCount: number
}

export function StatsCards({ totalProducts, outOfStockCount }: StatsCardsProps) {
  const stats = [
    {
      label: '상품 수',
      value: totalProducts.toString(),
      icon: Package,
      color: 'text-foreground',
    },
    {
      label: '소진',
      value: outOfStockCount.toString(),
      icon: XCircle,
      color: 'text-destructive',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col gap-2 rounded-xl bg-card p-3"
        >
          <div className="flex items-center gap-1">
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <span className={`text-lg font-semibold ${stat.color}`}>{stat.value}</span>
        </div>
      ))}
    </div>
  )
}
