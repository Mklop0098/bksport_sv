export interface IRevenueOrder {
    created_at: string
    totalPrice: number
    totalDiscount: number
    totalPriceAfterDiscount: number
}

export interface IReportRevenue {
    column: string
    totalDiscount: number
    totalAfterDiscount: number
    total: number
    type: string
}

export class RevenueCalc {
    private initializeRevenueMap(count: number, type: 'month' | 'day'): Map<number, IReportRevenue> {
        const revenueMap = new Map<number, IReportRevenue>()
        for (let index = 0; index < count; index++) {
            revenueMap.set(index, {
                column: type == 'month' ? `Tháng ${index + 1}` : `Ngày ${index + 1}`,
                totalDiscount: 0,
                totalAfterDiscount: 0,
                total: 0,
                type,
            })
        }
        return revenueMap
    }
    getRevenueByMonth(orders: IRevenueOrder[], year: number) {
        const revenueByMonth = this.initializeRevenueMap(12, 'month')

        orders.forEach(order => {
            const createdAt = new Date(order.created_at)
            if (createdAt.getFullYear() == year) {
                const monthIndex = createdAt.getMonth()
                const revenue = revenueByMonth.get(monthIndex)!
                revenue.total += order.totalPrice
                revenue.totalDiscount += order.totalDiscount || 0
                revenue.totalAfterDiscount += order.totalPriceAfterDiscount || 0
            }
        })

        return Array.from(revenueByMonth.values())
    }
    getRevenueByDay(orders: IRevenueOrder[], year: number, month: number) {
        const revenueByDay = this.initializeRevenueMap(31, 'day')
        orders.forEach(order => {
            const createdAt = new Date(order.created_at)
            if (createdAt.getFullYear() == year && createdAt.getMonth() + 1 == month) {
                const dayIndex = createdAt.getDate() - 1
                const revenue = revenueByDay.get(dayIndex)!
                revenue.total += order.totalPrice
                revenue.totalDiscount += order.totalDiscount || 0
                revenue.totalAfterDiscount += order.totalPriceAfterDiscount || 0
            }
        })

        return Array.from(revenueByDay.values())
    }
    getRevenueByYear(orders: IRevenueOrder[]) {
        const revenueByYear = new Map<string, IReportRevenue>()
        const currentYear = new Date().getFullYear()

        for (let year = 2024; year <= currentYear; year++) {
            revenueByYear.set(year.toString(), {
                column: year.toString(),
                totalDiscount: 0,
                totalAfterDiscount: 0,
                total: 0,
                type: 'year',
            })
        }

        orders.forEach(order => {
            const createdAt = new Date(order.created_at)
            const year = createdAt.getFullYear()
            if (year >= 2024) {
                const yearStr = year.toString()
                const revenue = revenueByYear.get(yearStr)!
                revenue.total += order.totalPrice
                revenue.totalDiscount += order.totalDiscount || 0
                revenue.totalAfterDiscount += order.totalPriceAfterDiscount || 0
            }
        })

        return Array.from(revenueByYear.values())
    }
    async calculateRevenue(orders: IRevenueOrder[], year?: number, month?: number) {
        if (year !== undefined && month !== undefined) {
            const revenueByDay = this.getRevenueByDay(orders, year, month)
            return {
                data: revenueByDay,
                summary: this.getSummaryRevenue(orders),
            }
        } else if (year !== undefined) {
            const revenueByMonth = this.getRevenueByMonth(orders, year)
            return {
                data: revenueByMonth,
                summary: this.getSummaryRevenue(orders),
            }
        } else {
            const revenueByYear = this.getRevenueByYear(orders)
            return {
                data: revenueByYear,
                summary: this.getSummaryRevenue(orders),
            }
        }
    }
    getSummaryRevenue(orders: IRevenueOrder[]) {
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0)
        return {
            totalDiscount: orders.reduce((acc, order) => acc + (order.totalDiscount || 0), 0),
            totalAfterDiscount: orders.reduce((acc, order) => acc + (order.totalPriceAfterDiscount || 0), 0),
            total: totalRevenue,
        }
    }
}
