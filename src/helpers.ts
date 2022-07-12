import { ScoresheetBaseFragment } from './graphql/generated'

export type CompetitionEvent = `e.${string}.${'fs' | 'sp' | 'oa'}.${'sr' | 'dd' | 'wh' | 'ts' | 'xd'}.${string}.${number}.${`${number}x${number}` | number}`

export type ScoreTally = Partial<Record<string, number>>

export interface GenericMark {
  readonly timestamp: number
  readonly sequence: number // should always === index
  readonly schema: string
  readonly value?: number
}

export interface UndoMark {
  readonly timestamp: number
  readonly sequence: number // should always === index
  readonly schema: 'undo'
  readonly target: number
}
export function isUndoMark (x: any): x is UndoMark { return x && x.schema === 'undo' }

export type Mark = GenericMark | UndoMark
export type StreamMark = Mark & {
  readonly scoresheetId: string
}
export type DeviceStreamMark = Mark & {
  readonly deviceId: string
}

/**
 * Gets the 4-character abbreviation of a competition event definition
 */
export function getAbbr (cEvtDef: CompetitionEvent) {
  return cEvtDef.split('.')[4]
}

/**
 * Filters an array of scoresheets returning only scoresheets for the specified
 * competition event and only the newest scoresheet for each judge assignment.
 *
 * For example if J001 is judge type S and has submitted a MarkScoresheet at
 * timestamp 1 and a TallyScoresheet at timestamp 5, only the TallyScoresheet
 * will be left
 */
export function filterLatestScoresheets (scoresheets: ScoresheetBaseFragment[]) {
  return [...scoresheets]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((scsh, idx, arr) =>
      idx === arr.findIndex(s => s.judge.id === scsh.judge.id && s.judgeType === scsh.judgeType)
    )
}

export enum CompetitionEventType {
  Freestyle,
  Speed,
  Overall
}
/**
 * Returns whether a competition event definition identified a speed event
 */
export function getCompetitionEventType (cEvtDef: string) {
  switch (cEvtDef.split('.')[2]) {
    case 'sp':
      return CompetitionEventType.Speed
    case 'fs':
      return CompetitionEventType.Freestyle
    case 'oa':
      return CompetitionEventType.Overall
    default:
      throw new TypeError(`cEvtDef ${cEvtDef} is of unknown event type`)
  }
}

export function processMark (mark: Mark | StreamMark, tally: ScoreTally, marks: Map<number, Mark | StreamMark>) {
  // we'va already processed this mark, abort
  if (marks.has(mark.sequence + (tally.offset ?? 0))) return

  if (isUndoMark(mark)) {
    const undoneMark = marks.get(mark.target + (tally.offset ?? 0))
    if (!undoneMark) throw new Error('Undone mark missing')
    if (!isUndoMark(undoneMark)) {
      tally[undoneMark.schema] = (tally[undoneMark.schema] ?? 0) - (undoneMark.value ?? 1)
    }
  } else if (mark.schema === 'clear') {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    for (const prop of Object.keys(tally)) delete tally[prop]
    marks.clear()
    // No more processing!
    return
  } else {
    tally[mark.schema] = (tally[mark.schema] ?? 0) + (mark.value ?? 1)
  }

  // and finally mark that we've processed this mark
  marks.set(mark.sequence + (tally.offset ?? 0), mark)
}

const locales = ['en-SE', 'en-AU', 'en-GB']
const dateFormatter = Intl.DateTimeFormat(locales, {
  dateStyle: 'medium',
  timeStyle: 'medium',
  hour12: false
})
/**
 * Formats a date and time into a human readable format, in the en-SE locale
 * this results in something like 22 Aug 2021, 21:08:27
 */
export function formatDate (timestamp: number | Date): string {
  return dateFormatter.format(timestamp)
}
