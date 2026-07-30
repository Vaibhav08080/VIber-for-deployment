interface GitHubFile {
  path: string;
  content: string;
}

export interface GitHubProfile {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

/**
 * Fetch authenticated GitHub user profile
 */
export async function getGitHubUserProfile(token: string): Promise<GitHubProfile> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "SparkSite-App",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch GitHub user (${res.status})`);
  }

  return await res.json();
}

/**
 * Create repository if it doesn't exist, or return existing repository details
 */
export async function createOrGetGitHubRepo(
  token: string,
  repoName: string,
  isPrivate: boolean = false
): Promise<{ owner: string; name: string; html_url: string; full_name: string }> {
  const user = await getGitHubUserProfile(token);
  const owner = user.login;
  const sanitizedRepoName = repoName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/^-+|-+$/g, "");

  // Check if repository already exists
  const checkRes = await fetch(`https://api.github.com/repos/${owner}/${sanitizedRepoName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "SparkSite-App",
    },
  });

  if (checkRes.ok) {
    const existing = await checkRes.json();
    return {
      owner: existing.owner.login,
      name: existing.name,
      html_url: existing.html_url,
      full_name: existing.full_name,
    };
  }

  // Create repository
  const createRes = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "SparkSite-App",
    },
    body: JSON.stringify({
      name: sanitizedRepoName,
      description: "Generated with SparkSite / Vibel AI",
      private: isPrivate,
      auto_init: true, // Creates initial commit with README.md so git ref exists
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create GitHub repository (${createRes.status})`);
  }

  const created = await createRes.json();
  return {
    owner: created.owner.login,
    name: created.name,
    html_url: created.html_url,
    full_name: created.full_name,
  };
}

/**
 * Commit and push multiple files to a GitHub repository using Git Database API
 */
export async function pushFilesToGitHubRepo(
  token: string,
  owner: string,
  repo: string,
  files: { [path: string]: string },
  commitMessage: string = "Update code via SparkSite AI"
): Promise<{ commitSha: string; commitUrl: string }> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "User-Agent": "SparkSite-App",
  };

  // 1. Get branch ref (default to main)
  let branch = "main";
  let refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, { headers });
  
  if (!refRes.ok) {
    // Try master if main doesn't exist
    refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/master`, { headers });
    if (refRes.ok) branch = "master";
  }

  if (!refRes.ok) {
    // If empty repository, create README via contents API to initialize branch
    const initRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/README.md`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Initial commit",
        content: Buffer.from("# " + repo + "\n\nGenerated with SparkSite").toString("base64"),
      }),
    });
    if (!initRes.ok) {
      throw new Error("Failed to initialize repository branch.");
    }
    // Re-fetch ref
    refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
  }

  const refData = await refRes.json();
  const latestCommitSha = refData.object.sha;

  // 2. Get latest commit to find base tree SHA
  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, { headers });
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  // 3. Create tree entries for all files
  const treeEntries = [];
  for (const [rawPath, content] of Object.entries(files)) {
    const cleanPath = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
    treeEntries.push({
      path: cleanPath,
      mode: "100644",
      type: "blob",
      content: content,
    });
  }

  // Create tree
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeEntries,
    }),
  });

  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create Git tree.");
  }

  const treeData = await treeRes.json();
  const newTreeSha = treeData.sha;

  // 4. Create new commit
  const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: newTreeSha,
      parents: [latestCommitSha],
    }),
  });

  if (!newCommitRes.ok) {
    const err = await newCommitRes.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create Git commit.");
  }

  const newCommitData = await newCommitRes.json();
  const newCommitSha = newCommitData.sha;

  // 5. Update branch ref
  const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      sha: newCommitSha,
      force: true,
    }),
  });

  if (!updateRefRes.ok) {
    const err = await updateRefRes.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update branch reference.");
  }

  return {
    commitSha: newCommitSha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
  };
}
