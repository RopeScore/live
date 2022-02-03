import { BaseScoresheetFragment } from './graphql/generated'

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

/**
 * Filters an array of scoresheets returning only scoresheets for the specified
 * competition event and only the newest scoresheet for each judge assignment.
 *
 * For example if J001 is judge type S and has submitted a MarkScoresheet at
 * timestamp 1 and a TallyScoresheet at timestamp 5, only the TallyScoresheet
 * will be left
 */
export function filterLatestScoresheets (scoresheets: BaseScoresheetFragment[]) {
  return [...scoresheets]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((scsh, idx, arr) =>
      idx === arr.findIndex(s => s.judgeId === scsh.judgeId && s.judgeType === scsh.judgeType)
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
    tally.offset = mark.sequence
  } else {
    tally[mark.schema] = (tally[mark.schema] ?? 0) + (mark.value ?? 1)
  }

  // and finally mark that we've processed this mark
  marks.set(mark.sequence + (tally.offset ?? 0), mark)
}
