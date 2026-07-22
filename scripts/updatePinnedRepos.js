const fs = require("fs");

const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME;

const query = `
query($login: String!) {
  user(login: $login) {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          url
          description
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
      variables: {
        login: USERNAME,
      },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error(JSON.stringify(data.errors, null, 2));
  }

  return data.data.user.pinnedItems.nodes;
}

function generateTable(repos) {
  let html = `<table>`;

  for (let i = 0; i < repos.length; i += 2) {
    html += `<tr>`;

    for (let j = i; j < i + 2; j++) {
      if (repos[j]) {
        const repo = repos[j];

        html += `
<td width="50%" valign="top">

### 📦 <a href="${repo.url}">${repo.name}</a>

${repo.description || "_No description available._"}

</td>
`;
      } else {
        html += `<td width="50%"></td>`;
      }
    }

    html += `</tr>`;
  }

  html += `</table>`;

  return html;
}

function updateReadme(content) {
  const readme = fs.readFileSync("README.md", "utf8");

  const updated = readme.replace(
    /<!--START_PINNED-->[\s\S]*<!--END_PINNED-->/,
    `<!--START_PINNED-->

${content}

<!--END_PINNED-->`
  );

  fs.writeFileSync("README.md", updated);
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

    console.log("README updated successfully.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
