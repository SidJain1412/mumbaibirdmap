import posthog from 'posthog-js'

export function usePostHog() {
  posthog.init('phc_i9aBKuziBsVefI47vNZp1BJEqjXlLaw4qjfmHOV0CPc', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2025-05-24',
    person_profiles: 'always',
  })

  return { posthog }
} 