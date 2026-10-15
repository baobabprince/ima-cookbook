import { Recipe } from '../types/recipe';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
}

export function getGitHubConfig(): GitHubConfig {
  return {
    token: import.meta.env.VITE_GITHUB_TOKEN || '',
    owner: import.meta.env.VITE_GITHUB_OWNER || 'baobabprince',
    repo: import.meta.env.VITE_GITHUB_REPO || 'ima-cookbook',
    branch: import.meta.env.VITE_GITHUB_BRANCH || 'main',
    filePath: 'public/recipes.json',
  };
}

export function isGitHubSyncConfigured(): boolean {
  const config = getGitHubConfig();
  return Boolean(config.token && config.owner && config.repo);
}

export function decodeBase64Utf8(base64Str: string): string {
  const cleanBase64 = base64Str.replace(/\s/g, '');
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binaryString = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}

export interface FetchGitHubRecipesResult {
  recipes: Recipe[];
  sha: string;
}

/**
 * Fetches the latest recipes.json file directly from GitHub repository API.
 */
export async function fetchRecipesFromGitHub(): Promise<FetchGitHubRecipesResult> {
  const config = getGitHubConfig();
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}?ref=${config.branch}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  const response = await fetch(url, { headers, cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`GitHub API Error (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.content || !data.sha) {
    throw new Error('Invalid GitHub API response: Missing file content or SHA.');
  }

  const jsonText = decodeBase64Utf8(data.content);
  const parsedRecipes: Recipe[] = JSON.parse(jsonText);

  return {
    recipes: parsedRecipes,
    sha: data.sha,
  };
}

export interface SaveResult {
  success: boolean;
  recipes: Recipe[];
  error?: string;
}

/**
 * Saves a single updated or new recipe to GitHub with automatic recipe-level conflict resolution.
 * If a conflict (409) occurs, it automatically re-fetches latest file, merges the recipe edit, and retries.
 */
export async function saveRecipeToGitHub(
  recipeToSave: Recipe,
  commitMessage?: string,
  maxRetries = 3
): Promise<SaveResult> {
  const config = getGitHubConfig();

  if (!config.token) {
    return {
      success: false,
      recipes: [],
      error: 'VITE_GITHUB_TOKEN is missing. Please configure GitHub environment variables.',
    };
  }

  const msg = commitMessage || `Update recipe: ${recipeToSave.title}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 1. Fetch latest content & SHA from GitHub
      const { recipes: remoteRecipes, sha: latestSha } = await fetchRecipesFromGitHub();

      // 2. Perform recipe-level merge
      const existingIdx = remoteRecipes.findIndex((r) => r.id === recipeToSave.id);
      let mergedRecipes: Recipe[];

      if (existingIdx >= 0) {
        mergedRecipes = [...remoteRecipes];
        mergedRecipes[existingIdx] = recipeToSave;
      } else {
        mergedRecipes = [...remoteRecipes, recipeToSave];
      }

      // Keep sorted by orderIndex
      mergedRecipes.sort((a, b) => a.orderIndex - b.orderIndex);

      // 3. Prepare commit payload
      const jsonContent = JSON.stringify(mergedRecipes, null, 2);
      const encodedContent = encodeBase64Utf8(jsonContent);

      const putUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;
      const putResponse = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: msg,
          content: encodedContent,
          sha: latestSha,
          branch: config.branch,
        }),
      });

      if (putResponse.ok) {
        return {
          success: true,
          recipes: mergedRecipes,
        };
      }

      // If 409 Conflict or 422, retry on next loop iteration
      if ((putResponse.status === 409 || putResponse.status === 422) && attempt < maxRetries) {
        console.warn(`GitHub push conflict on attempt ${attempt}. Retrying auto-merge...`);
        await new Promise((res) => setTimeout(res, 500 * attempt));
        continue;
      }

      const errData = await putResponse.json().catch(() => ({}));
      return {
        success: false,
        recipes: mergedRecipes,
        error: errData.message || `GitHub error (${putResponse.status})`,
      };
    } catch (err: unknown) {
      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, 500 * attempt));
        continue;
      }
      return {
        success: false,
        recipes: [],
        error: err instanceof Error ? err.message : 'Unknown error during GitHub sync',
      };
    }
  }

  return {
    success: false,
    recipes: [],
    error: 'Exceeded maximum retries for GitHub auto-merge.',
  };
}

/**
 * Pushes full list of recipes to GitHub (used for bulk resets or additions).
 */
export async function saveAllRecipesToGitHub(
  allRecipes: Recipe[],
  commitMessage: string,
  maxRetries = 3
): Promise<SaveResult> {
  const config = getGitHubConfig();

  if (!config.token) {
    return {
      success: false,
      recipes: allRecipes,
      error: 'VITE_GITHUB_TOKEN is missing. Please configure GitHub environment variables.',
    };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { sha: latestSha } = await fetchRecipesFromGitHub();
      const sorted = [...allRecipes].sort((a, b) => a.orderIndex - b.orderIndex);
      const jsonContent = JSON.stringify(sorted, null, 2);
      const encodedContent = encodeBase64Utf8(jsonContent);

      const putUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;
      const putResponse = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: encodedContent,
          sha: latestSha,
          branch: config.branch,
        }),
      });

      if (putResponse.ok) {
        return {
          success: true,
          recipes: sorted,
        };
      }

      if ((putResponse.status === 409 || putResponse.status === 422) && attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, 500 * attempt));
        continue;
      }

      const errData = await putResponse.json().catch(() => ({}));
      return {
        success: false,
        recipes: sorted,
        error: errData.message || `GitHub error (${putResponse.status})`,
      };
    } catch (err: unknown) {
      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, 500 * attempt));
        continue;
      }
      return {
        success: false,
        recipes: allRecipes,
        error: err instanceof Error ? err.message : 'Unknown error during GitHub bulk sync',
      };
    }
  }

  return {
    success: false,
    recipes: allRecipes,
    error: 'Exceeded maximum retries for GitHub bulk sync.',
  };
}
