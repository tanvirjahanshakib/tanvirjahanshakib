const fs = require("fs");

async function getPinnedRepos() {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;

  if (!token || !username) {
    throw new Error("GITHUB_TOKEN and GITHUB_USERNAME are required.");
  }

  const query = `
    query($username: String!) {
      user(login: $username) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              url
              homepageUrl
              stargazerCount
              forkCount
              primaryLanguage {
                name
                color
              }
              openGraphImageUrl
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: "Bearer ".concat(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { username },
    }),
  });

  const result = await response.json();

  if (!response.ok || result.errors) {
    throw new Error(
      `Failed to fetch pinned repositories: ${
        result.errors?.map(error => error.message).join(", ") ||
        response.statusText
      }`
    );
  }

  const repos = result.data.user.pinnedItems.nodes.map(repo => ({
    name: repo.name,
    description: repo.description || "No description available.",
    url: repo.url,
    homepage: repo.homepageUrl,
    stars: repo.stargazerCount,
    forks: repo.forkCount,
    language: repo.primaryLanguage?.name || "Unknown",
    color: repo.primaryLanguage?.color || "#586069",
    image: repo.openGraphImageUrl,
  }));

  return generateTable(repos);
}

function generateTable(repos) {
  let html = `
<table width="100%" cellspacing="10" cellpadding="0">
<tbody>
`;

  for (let i = 0; i < repos.length; i += 2) {
    html += `<tr>`;

    for (let j = i; j < i + 2; j++) {
      if (!repos[j]) {
        html += `<td width="50%"></td>`;
        continue;
      }

      const repo = repos[j];

      html += `
<td width="50%" valign="top">
<table width="100%" cellpadding="16" cellspacing="0" style="border:1px solid #30363d; border-radius:12px;">
<tr>
<td>
<p align="center">
<a href="${repo.url}">
<img src="${repo.image}" width="100%">
</a>
</p>
<h3>
📦
<a href="${repo.url}">
${repo.name}
</a>
</h3>
<p>
${repo.description}
</p>
<p>
<img src="https://img.shields.io/badge/Language-${encodeURIComponent(repo.language)}-blue?style=flat-square">
<img src="https://img.shields.io/badge/⭐-${repo.stars}-yellow?style=flat-square">
<img src="https://img.shields.io/badge/🍴-${repo.forks}-blue?style=flat-square">
</p>
<p>
${repo.homepage ? `
<a href="${repo.homepage}">
<img src="https://img.shields.io/badge/🌐-Live_Demo-2ea44f?style=for-the-badge">
</a>
` : ""}
<a href="${repo.url}">
<img src="https://img.shields.io/badge/🐙-Repository-181717?style=for-the-badge&logo=github&logoColor=white">
</a>
</p>
</td>
</tr>
</table>
</td>
`;
    }

    html += `</tr>`;
  }

  html += `
</tbody>
</table>
`;

  return html;
}

async function updateReadme() {
  const repoCards = await getPinnedRepos();
  const readmePath = "README.md";
  const readme = fs.readFileSync(readmePath, "utf8");
  const start = "<!--START_PINNED-->";
  const end = "<!--END_PINNED-->";

  const newSection = `
${start}

${repoCards}

${end}
`;

  const updatedReadme = readme.replace(
    new RegExp(`${start}[\\s\\S]*?${end}`),
    newSection
  );

  fs.writeFileSync(readmePath, updatedReadme);
  console.log("README updated successfully ✅");
}

updateReadme().catch(error => {
  console.error(error.message);
  process.exit(1);
});
