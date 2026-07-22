const fs = require("fs");

const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME;

if (!TOKEN || !USERNAME) {
  console.error("Missing GITHUB_TOKEN or GITHUB_USERNAME.");
  process.exit(1);
}

const query = `
  query($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            url
          }
        }
      }
    }
  }
`;

async function fetchPinnedRepos() {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { login: USERNAME },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error(JSON.stringify(data.errors, null, 2));
  }

  return data.data.user.pinnedItems.nodes;
}

function generateTable(repos) {
  let html = "<table>\n";

  for (let i = 0; i < repos.length; i += 2) {
    html += "<tr>\n";

    for (let j = i; j < i + 2; j++) {
      if (repos[j]) {
        const repo = repos[j];
        html += `<td width="50%">
  <a href="${repo.url}">
    <img src="https://github-readme-stats.vercel.app/api/pin/?username=${USERNAME}&repo=${repo.name}&theme=tokyonight" />
  </a>
</td>
`;
      } else {
        html += "<td width="50%"></td>\n";
      }
    }

    html += "</tr>\n";
  }

  html += "</table>";
  return html;
}

function updateReadme(tableHtml) {
  const readmePath = "README.md";
  const readme = fs.readFileSync(readmePath, "utf8");

  const start = "<!--START_PINNED-->";
  const end = "<!--END_PINNED-->";

  const regex = new RegExp(`${start}[\\s\\S]*?${end}`, "m");

  const replacement = `${start}\n\n${tableHtml}\n\n${end}`;

  const updated = readme.replace(regex, replacement);

  if (updated !== readme) {
    fs.writeFileSync(readmePath, updated);
    console.log("README updated successfully.");
  } else {
    console.log("README already up to date.");
  }
}

(async () => {
  try {
    const repos = await fetchPinnedRepos();

    if (!repos.length) {
      console.log("No pinned repositories found.");
      process.exit(0);
    }

    const table = generateTable(repos);
    updateReadme(table);
  } catch (error) {
    console.error("Failed to update pinned repositories:");
    console.error(error.message);
    process.exit(1);
  }
})();
