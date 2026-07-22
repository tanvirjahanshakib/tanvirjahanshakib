const fs = require("fs");

const USERNAME = process.env.GITHUB_USERNAME;

if (!USERNAME) {
  console.error("Missing GITHUB_USERNAME");
  process.exit(1);
}

async function fetchPinnedRepos() {
  const res = await fetch(`https://github.com/${USERNAME}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }

  const html = await res.text();

  // Match pinned repository links
  const regex = new RegExp(`href="/${USERNAME}/([^"]+)"`, "g");

  const repos = [];
  const seen = new Set();

  let match;

  while ((match = regex.exec(html)) !== null) {
    const repo = match[1];

    if (
      !seen.has(repo) &&
      repo !== "?tab=repositories" &&
      !repo.includes("/") &&
      repo !== ""
    ) {
      seen.add(repo);

      repos.push({
        name: repo,
        url: `https://github.com/${USERNAME}/${repo}`,
      });
    }

    if (repos.length === 6) break;
  }

  return repos;
}

function generateTable(repos) {
  let html = "<table>\n";

  for (let i = 0; i < repos.length; i += 2) {
    html += "<tr>\n";

    for (let j = i; j < i + 2; j++) {
      if (repos[j]) {
        html += `
<td width="50%">
<a href="${repos[j].url}">
<img src="https://github-readme-stats.vercel.app/api/pin/?username=${USERNAME}&repo=${repos[j].name}&theme=tokyonight"/>
</a>
</td>
`;
      } else {
        html += '<td width="50%"></td>\n';
      }
    }

    html += "</tr>\n";
  }

  html += "</table>";

  return html;
}

function updateReadme(table) {
  const readme = fs.readFileSync("README.md", "utf8");

  const updated = readme.replace(
    /<!--START_PINNED-->[\s\S]*<!--END_PINNED-->/,
    `<!--START_PINNED-->

${table}

<!--END_PINNED-->`
  );

  fs.writeFileSync("README.md", updated);

  console.log("README updated.");
}

(async () => {
  const repos = await fetchPinnedRepos();

  if (!repos.length) {
    throw new Error("No pinned repositories found.");
  }

  updateReadme(generateTable(repos));
})();
