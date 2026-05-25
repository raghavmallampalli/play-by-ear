/** Universal repository and external links configuration */
export const REPO_BASE_URL = 'https://github.com/dummy-user/play-by-ear';

/**
 * Returns the edit URL for a specific file path on the main branch.
 */
export function getRepoEditUrl(filePath: string): string {
  return `${REPO_BASE_URL}/edit/main/${filePath}`;
}
