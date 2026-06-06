export function getGreeting(name?: string): string {
    const hour = new Date().getHours()

    let sapaan = ''

    if (hour >= 5 && hour < 11) {
        sapaan = 'Selamat Pagi'
    } else if (hour >= 11 && hour < 15) {
        sapaan = 'Selamat Siang'
    } else if (hour >= 15 && hour < 18) {
        sapaan = 'Selamat Sore'
    } else {
        sapaan = 'Selamat Malam'
    }

    return name ? `${sapaan}, ${name}!` : `${sapaan}!`
}

export function getGreetingEmoji(): string {
    const hour = new Date().getHours()

    if (hour >= 5 && hour < 11) return '🌅'
    if (hour >= 11 && hour < 15) return '☀️'
    if (hour >= 15 && hour < 18) return '🌤️'
    return '🌙'
}