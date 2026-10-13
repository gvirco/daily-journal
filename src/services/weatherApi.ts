export type DailyWeather = {
  conditions: string
  high: number
  icon: string
  low: number
  source: 'forecast' | 'historical'
}

type OpenMeteoResponse = {
  daily?: {
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    weather_code?: number[]
  }
}

const vilniusCoordinates = { latitude: '54.6872', longitude: '25.2797' }
const timezone = 'Europe/Vilnius'
const forecastPastDays = 92
const forecastFutureDays = 16

function addCalendarDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getVilniusToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  }).formatToParts()
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

  return `${values.year}-${values.month}-${values.day}`
}

function describeWeatherCode(code: number) {
  if (code === 0) return { conditions: 'Clear sky', icon: '☀' }
  if (code === 1 || code === 2) return { conditions: 'Partly cloudy', icon: '⛅' }
  if (code === 3) return { conditions: 'Overcast', icon: '☁' }
  if (code === 45 || code === 48) return { conditions: 'Fog', icon: '🌫' }
  if ([51, 53, 55, 56, 57].includes(code)) return { conditions: 'Drizzle', icon: '🌦' }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { conditions: 'Rain', icon: '🌧' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { conditions: 'Snow', icon: '❄' }
  if ([95, 96, 97, 99].includes(code)) return { conditions: 'Thunderstorms', icon: '⛈' }

  return { conditions: 'Mixed conditions', icon: '☁' }
}

async function requestWeather(
  endpoint: string,
  date: string,
  source: DailyWeather['source'],
  signal: AbortSignal,
): Promise<DailyWeather | null> {
  const parameters = new URLSearchParams({
    ...vilniusCoordinates,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    end_date: date,
    start_date: date,
    timezone,
  })
  const response = await fetch(`${endpoint}?${parameters.toString()}`, { signal })
  if (!response.ok) throw new Error('Unable to load weather.')

  const data = await response.json() as OpenMeteoResponse
  const high = data.daily?.temperature_2m_max?.[0]
  const low = data.daily?.temperature_2m_min?.[0]
  const weatherCode = data.daily?.weather_code?.[0]
  if (high === undefined || low === undefined || weatherCode === undefined) return null

  return { ...describeWeatherCode(weatherCode), high, low, source }
}

export async function getWeatherForDate(date: string, signal: AbortSignal): Promise<DailyWeather | null> {
  const today = getVilniusToday()
  const todayDate = new Date(`${today}T00:00:00`)
  const earliestForecastDate = toDateValue(addCalendarDays(todayDate, -forecastPastDays))
  const latestForecastDate = toDateValue(addCalendarDays(todayDate, forecastFutureDays))

  if (date >= earliestForecastDate && date <= latestForecastDate) {
    return requestWeather('https://api.open-meteo.com/v1/forecast', date, 'forecast', signal)
  }
  if (date >= '1940-01-01' && date < earliestForecastDate) {
    return requestWeather('https://archive-api.open-meteo.com/v1/archive', date, 'historical', signal)
  }

  return null
}
