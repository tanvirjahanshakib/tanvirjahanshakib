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
 * Preview images:
 *   GraphQL's `openGraphImageUrl` field correctly returns each repo's real
 *   social preview (your custom uploaded image if one is set under repo
 *   Settings -> Social preview, otherwise GitHub's auto-generated stats
 *   card) — but as a temporary, signed S3 URL that expires ~5 minutes after
 *   the API call. Committing that URL directly into README.md breaks the
 *   image shortly after every workflow run.
 *
 *   There is currently no public REST or GraphQL field that returns a
 *   permanent link to a repo's *custom* social preview image (only the
 *   generic auto-card has a stable URL, at opengraph.githubassets.com/1/...,
 *   which ignores any custom image you've uploaded).
 *
 *   So instead of linking to a URL at all, this script DOWNLOADS the image
 *   bytes from the signed URL immediately (while it's still valid) and
 *   saves them as a local file under IMAGE_DIR, which gets committed to the
 *   repo alongside README.md. README.md then references that local file via
 *   a raw.githubusercontent.com URL, which never expires because it's your
 *   own committed content.
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
const IMAGE_DIR = path.join(process.cwd(), "assets", "pinned");
const IMAGE_DIR_REL = "assets/pinned"; // used when building README URLs
const START_MARKER = "<!--START_PINNED-->";
const END_MARKER = "<!--END_PINNED-->";
const MAX_REPOS = 6;
const CARDS_PER_ROW = 2;
const IMAGE_WIDTH = 400; // fixed width -> identical image size on every card
const DESCRIPTION_MAX_LEN = 110; // ~2 lines at typical README width
const BRANCH = process.env.GITHUB_REF_NAME || "main";

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

/**
 * Downloads binary content from a URL (follows redirects), returning a
 * Buffer. Used to grab the OpenGraph image bytes while the signed URL is
 * still valid, right after the GraphQL call that produced it.
 */
function downloadBuffer(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "updatePinnedRepos-script" } }, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          res.resume();
          return resolve(downloadBuffer(res.headers.location, redirectsLeft - 1));
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          return reject(new Error(`Image download failed: ${res.statusCode}`));
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
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
  return `[![Repository](https://img.shields.io/badge/Repository-0D1117?style=for-the-badge&logo=github&logoColor=white&labelColor=000000)](${url})`;
}

function demoButton(url) {
  return `[![Live Project](https://img.shields.io/badge/Live%20Project-2563EB?style=for-the-badge&logo=google-chrome&logoColor=white&labelColor=1E40AF)](${url})`;
}

/**
 * Downloads the repo's OpenGraph image (while its signed URL is still
 * valid) and saves it locally as `<repoName>.png`. Returns the permanent
 * raw.githubusercontent.com URL to reference in README.md, or null if the
 * download failed (in which case the card renders without an image rather
 * than with a broken link).
 */
async function saveLocalPreviewImage(repo) {
  if (!repo.openGraphImageUrl) return null;

  try {
    const bytes = await downloadBuffer(repo.openGraphImageUrl);
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
    const fileName = `${repo.name}.png`;
    fs.writeFileSync(path.join(IMAGE_DIR, fileName), bytes);
    return `https://raw.githubusercontent.com/${GH_LOGIN}/${GH_LOGIN}/${BRANCH}/${IMAGE_DIR_REL}/${fileName}`;
  } catch (err) {
    console.error(`Could not save preview image for ${repo.name}: ${err.message}`);
    return null;
  }
}

/**
 * Renders a single repository as the inner HTML/Markdown that goes inside a
 * <td>. `imageUrl` must already be resolved (see saveLocalPreviewImage).
 */
function renderCard(repo, imageUrl) {
  const imageBlock = imageUrl
    ? `<img src="${imageUrl}" width="${IMAGE_WIDTH}" alt="${escapeHtml(
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
async function buildGrid(repos) {
  if (repos.length === 0) {
    return "_No pinned repositories found yet._";
  }

  // Download + save each repo's preview image up front (sequential, so we
  // don't race the 5-minute expiry on many signed URLs at once).
  const imageUrls = [];
  for (const repo of repos) {
    imageUrls.push(await saveLocalPreviewImage(repo));
  }

  const rows = [];
  for (let i = 0; i < repos.length; i += CARDS_PER_ROW) {
    rows.push(
      repos.slice(i, i + CARDS_PER_ROW).map((repo, j) => ({
        repo,
        imageUrl: imageUrls[i + j],
      }))
    );
  }

  const colWidth = Math.floor(100 / CARDS_PER_ROW);

  const rowsHtml = rows
    .map((row) => {
      const cells = row
        .map(
          ({ repo, imageUrl }) =>
            `<td width="${colWidth}%" valign="top">\n\n${renderCard(
              repo,
              imageUrl
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

  const grid = await buildGrid(repos);
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

  fs.writeFileSync(README_PATH, updated, "utf8");
  console.log("README.md updated with latest pinned repositories.");

  // Surface repo count + names as step outputs so the workflow can build an
  // informative commit message instead of a generic static string.
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    const repoNames = repos.map((r) => r.name).join(", ");
    fs.appendFileSync(
      outputPath,
      `repo_count=${repos.length}\nrepo_names=${repoNames}\n`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
