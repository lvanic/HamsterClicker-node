export function formatNumber(num: number) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function formatNumberWithoutDot(num: number) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}
