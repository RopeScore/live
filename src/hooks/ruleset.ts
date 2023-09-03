import { unref, watch, isRef, ref } from 'vue'
import { importPreconfiguredCompetitionEvent } from '../import-helpers'
import type { MaybeRef } from '@vueuse/core'
import { type CompetitionEvent } from '@ropescore/rulesets'

export function useCompetitionEvent (competitionEventId: MaybeRef<string | undefined>) {
  const competitionEvent = ref<CompetitionEvent>()

  const key = unref(competitionEventId)
  if (key != null) {
    importPreconfiguredCompetitionEvent(key)
      .then(ce => { competitionEvent.value = ce })
      .catch(err => {
        console.error(err)
      })
  }

  if (isRef(competitionEventId)) {
    watch(competitionEventId, id => {
      if (id == null) competitionEvent.value = undefined
      else {
        importPreconfiguredCompetitionEvent(id)
          .then(ce => { competitionEvent.value = ce })
          .catch(err => {
            console.error(err)
          })
      }
    })
  }

  return competitionEvent
}
