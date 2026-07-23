/**
 * updatePinnedRepos.js
 * ---------------------------------------------------------------------------
 * Fetches the authenticated user's PINNED repositories from GitHub's GraphQL
 * API and renders them as a GitHub-Dark-themed, table-based card grid
 * (2 cards per row, auto-flowing, no empty/placeholder cards) directly inside
 * README.md, between the markers:
 *
 *   <!--START_PINNED-->
 *   <!--END_PINNED-->
 *
 * 100% GitHub-README compatible:
 *   - Only Markdown + inline HTML (<table>, <tr>, <td>, <img>, <a>, <b>, <br>)
 *   - No <style>, no inline `style="..."`, no CSS grid/flexbox/box-shadow
 *     (GitHub's HTML sanitizer strips the `style` attribute entirely, so all
 *     "theming" below — colors, borders, badges, buttons — is done with
 *     pre-rendered shields.io badge IMAGES, which GitHub does not sanitize).
 *
 * Required environment variables:
 *   GH_TOKEN     - a GitHub token (classic PAT with `read:user` scope is enough,
 *                  a fine-grained token with "Read access to profile" also works)
 *   GH_LOGIN     - the GitHub username whose pinned repos should be shown
 *                  (falls back to GITHUB_REPOSITORY_OWNER in Actions)
 *
 * Usage:
 *   GH_TOKEN=xxx GH_LOGIN=yourname node updatePinnedRepos.js
 * ---------------------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const README_PATH = path.join(process.cwd(), "README.md");
const START_MARKER = "<!--START_PINNED-->";
const END_MARKER = "<!--END_PINNED-->";
const MAX_REPOS = 6;
const CARDS_PER_ROW = 2;
const IMAGE_WIDTH = 400; // fixed width -> identical image size on every card
const DESCRIPTION_MAX_LEN = 110; // ~2 lines at typical README width

const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const GH_LOGIN = process.env.GH_LOGIN || process.env.GITHUB_REPOSITORY_OWNER;

if (!GH_TOKEN) {
  console.error("Missing GH_TOKEN environment variable.");
  process.exit(1);
}
if (!GH_LOGIN) {
  console.error("Missing GH_LOGIN environment variable.");
  process.exit(1);
}

const QUERY = `
query ($login: String!, $count: Int!) {
  user(login: $login) {
    pinnedItems(first: $count, types: [REPOSITORY]) {
      nodes {
        ... on Repository {
          name
          description
          url
          homepageUrl
          stargazerCount
          forkCount
          openGraphImageUrl
          isTemplate
          primaryLanguage {
            name
            color
          }
        }
      }
    }
  }
}`;

function graphqlRequest(query, variables) {
  const payload = JSON.stringify({ query, variables });

  const options = {
    hostname: "api.github.com",
    path: "/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${GH_TOKEN}`,
      "User-Agent": "updatePinnedRepos-script",
      Accept: "application/vnd.github+json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(
            new Error(`GitHub API responded ${res.statusCode}: ${data}`)
          );
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.errors) {
            return reject(
              new Error(`GraphQL errors: ${JSON.stringify(parsed.errors)}`)
            );
          }
          resolve(parsed.data);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateDescription(desc) {
  if (!desc) return "No description provided.";
  const clean = desc.trim().replace(/\s+/g, " ");
  if (clean.length <= DESCRIPTION_MAX_LEN) return clean;
  return clean.slice(0, DESCRIPTION_MAX_LEN).replace(/\s+\S*$/, "") + "…";
}

// Encode a string for safe use inside a shields.io badge path segment.
function shield(text) {
  return encodeURIComponent(String(text))
    .replace(/-/g, "--")
    .replace(/_/g, "__");
}

function languageBadge(lang) {
  if (!lang || !lang.name) {
    return `![language](https://img.shields.io/badge/-Unknown-8b949e?style=flat-square&labelColor=161b22)`;
  }
  const color = (lang.color || "#8b949e").replace("#", "");
  return `![${escapeHtml(lang.name)}](https://img.shields.io/badge/-${shield(
    lang.name
  )}-${color}?style=flat-square&labelColor=161b22&logo=github&logoColor=white)`;
}

function statBadge(label, value, color) {
  return `![${label}](https://img.shields.io/badge/${shield(
    label
  )}-${value}-${color}?style=flat-square&labelColor=161b22)`;
}

function repoButton(url) {
  return `[![Repository](https://img.shields.io/badge/-Repository-0d1117?style=for-the-badge&logo=github&logoColor=white)](${url})`;
}

function demoButton(url) {
  return `[![Live Demo](https://img.shields.io/badge/-Live%20Demo-238636?style=for-the-badge&logo=vercel&logoColor=white)](${url})`;
}

/**
 * Renders a single repository as the inner HTML/Markdown that goes inside a
 * <td>. No image area is emitted at all when there is no openGraphImageUrl
 * worth showing (GitHub returns a generic default OG image even for repos
 * without a custom social preview — we detect and skip that case so we never
 * render a meaningless placeholder banner).
 */
function renderCard(repo) {
  const hasRealPreview =
    repo.openGraphImageUrl &&
    !repo.openGraphImageUrl.includes("/opengraph/default") &&
    !repo.openGraphImageUrl.includes("avatars.githubusercontent.com");

  const imageBlock = hasRealPreview
    ? `<img src="${repo.openGraphImageUrl}" width="${IMAGE_WIDTH}" alt="${escapeHtml(
        repo.name
      )} preview" /><br/>`
    : "";

  const description = escapeHtml(truncateDescription(repo.description));

  const stats = [
    languageBadge(repo.primaryLanguage),
    statBadge("★", repo.stargazerCount, "30363d"),
    statBadge("⑂", repo.forkCount, "30363d"),
  ].join(" ");

  const buttons = repo.homepageUrl
    ? `${repoButton(repo.url)} ${demoButton(repo.homepageUrl)}`
    : repoButton(repo.url);

  return `${imageBlock}

### 📦 [${escapeHtml(repo.name)}](${repo.url})

${description}

${stats}

${buttons}
`;
}

/**
 * Builds the full grid: chunks repos into rows of CARDS_PER_ROW.
 * The final, possibly-partial row NEVER gets a padding/empty <td> —
 * a row with a single repo simply contains a single <td>.
 */
function buildGrid(repos) {
  if (repos.length === 0) {
    return "_No pinned repositories found yet._";
  }

  const rows = [];
  for (let i = 0; i < repos.length; i += CARDS_PER_ROW) {
    rows.push(repos.slice(i, i + CARDS_PER_ROW));
  }

  const colWidth = Math.floor(100 / CARDS_PER_ROW);

  const rowsHtml = rows
    .map((row) => {
      const cells = row
        .map(
          (repo) =>
            `<td width="${colWidth}%" valign="top">\n\n${renderCard(
              repo
            )}\n</td>`
        )
        .join("\n");
      return `<tr>\n${cells}\n</tr>`;
    })
    .join("\n");

  return `<table>\n${rowsHtml}\n</table>`;
}

async function main() {
  console.log(`Fetching pinned repositories for @${GH_LOGIN}...`);
  const data = await graphqlRequest(QUERY, { login: GH_LOGIN, count: MAX_REPOS });

  const nodes = data?.user?.pinnedItems?.nodes || [];
  const repos = nodes.filter(Boolean).slice(0, MAX_REPOS);

  console.log(`Found ${repos.length} pinned repositories.`);

  const grid = buildGrid(repos);
  const block = `${START_MARKER}\n${grid}\n${END_MARKER}`;

  if (!fs.existsSync(README_PATH)) {
    console.error(`README.md not found at ${README_PATH}`);
    process.exit(1);
  }

  const original = fs.readFileSync(README_PATH, "utf8");

  const markerRegex = new RegExp(
    `${START_MARKER}[\\s\\S]*?${END_MARKER}`,
    "m"
  );

  let updated;
  if (markerRegex.test(original)) {
    updated = original.replace(markerRegex, block);
  } else {
    // Markers not present yet -> append a new section at the end.
    updated = `${original.trim()}\n\n## ✨ Featured Repositories\n\n${block}\n`;
  }

  if (updated === original) {
    console.log("No changes detected — README.md already up to date.");
    return;
  }

  fs.writeFileSync(README_PATH, updated, "utf8");
  console.log("README.md updated with latest pinned repositories.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
