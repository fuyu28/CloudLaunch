export function isValidR2OrS3Endpoint(urlString: string): boolean {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return false
  }

  const host = url.host.toLowerCase()
  const cfR2Pattern = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?\.r2\.cloudflarestorage\.com$/
  const awsS3Patterns = [
    /^[a-z0-9][a-z0-9-]{1,61}\.s3\.[a-z0-9-]+\.amazonaws\.com$/,
    /^s3\.[a-z0-9-]+\.amazonaws\.com$/,
    /^[a-z0-9][a-z0-9-]{1,61}\.s3\.amazonaws\.com$/
  ]

  if (url.protocol !== "https:") {
    return false
  }

  if (cfR2Pattern.test(host)) {
    return true
  }
  if (awsS3Patterns.some((p) => p.test(host))) {
    return true
  }
  return false
}
