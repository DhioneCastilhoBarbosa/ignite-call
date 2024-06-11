import { prisma } from '@/src/lib/prisma'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { NextApiRequest, NextApiResponse } from 'next'

dayjs.extend(utc)

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  const username = String(req.query.username)
  const { date, timezoneOffset } = req.query

  if (!date || !timezoneOffset) {
    return res
      .status(400)
      .json({ message: 'Date or timezoneOffset not provided' })
  }

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  })

  if (!user) {
    return res.status(400).json({ message: 'User does not exist' })
  }

  const referenceDate = dayjs(String(date))
  const isPastDate = referenceDate.endOf('day').isBefore(new Date())

  const timezoneOffsetInhours =
    typeof timezoneOffset === 'string'
      ? Number(timezoneOffset) / 60
      : Number(timezoneOffset[0]) / 60

  const referenceDateTimeZoneOffsetInHours =
    referenceDate.toDate().getTimezoneOffset() / 60
  if (isPastDate) {
    return res.json({ possibleTimes: [], availability: [] })
  }

  const userAvailability = await prisma.userTimeInterval.findFirst({
    where: {
      user_id: user.id,
      week_days: referenceDate.get('day'),
    },
  })

  if (!userAvailability) {
    return res.json({ possibleTimes: [], availability: [] })
  }

  const { time_start_in_minutes, time_end_in_minutes } = userAvailability

  const startHour = time_start_in_minutes / 60
  const endtHour = time_end_in_minutes / 60

  const possibleTimes = Array.from({ length: endtHour - startHour }).map(
    (_, i) => {
      return startHour + i
    },
  )

  const blockedTimes = await prisma.scheduling.findMany({
    select: {
      date: true,
    },
    where: {
      user_id: user.id,
      date: {
        gte: referenceDate
          .set('hour', startHour)
          .add(timezoneOffsetInhours, 'hours')
          .toDate(),
        lte: referenceDate
          .set('hour', endtHour)
          .add(timezoneOffsetInhours, 'hours')
          .toDate(),
      },
    },
  })

  const availableTimes = possibleTimes.filter((time) => {
    const isTimeBlocked = blockedTimes.some(
      (blockedTimes) =>
        blockedTimes.date.getUTCHours() - timezoneOffsetInhours === time,
    )

    const isTimeInPast = referenceDate
      .set('hour', time)
      .subtract(referenceDateTimeZoneOffsetInHours, 'hours')
      .isBefore(dayjs().utc().subtract(timezoneOffsetInhours, 'hours'))
    return !isTimeBlocked && !isTimeInPast
  })

  return res.json({ possibleTimes, availableTimes })
}
