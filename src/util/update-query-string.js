export default function updateQueryString(key, value) {
  const url = new URL(window.location)
  const params = new URLSearchParams(url.search)
  if (value.length === 0) params.delete(key)
  else params.set(key, value)

  url.search = params.toString()
  // eslint-disable-next-line no-restricted-globals
  history.pushState({}, '', url.toString())
}
