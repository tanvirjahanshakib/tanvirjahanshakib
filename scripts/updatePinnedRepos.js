const repos = result.data.user.pinnedItems.nodes.map(repo => ({
  name: repo.name,
  description: repo.description || "No description available.",
  url: repo.url,
  homepage: repo.homepageUrl,
  stars: repo.stargazerCount,
  forks: repo.forkCount,
  language: repo.primaryLanguage?.name || "Unknown",
  color: repo.primaryLanguage?.color || "#808080",
  image: repo.openGraphImageUrl
}));`;


  const response = await fetch(
    "https://api.github.com/graphql",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );


  const result = await response.json();


const repos = result.data.user.pinnedItems.nodes.map(repo => ({
  name: repo.name,
  description: repo.description || "No description available.",
  url: repo.url,
  homepage: repo.homepageUrl,

  stars: repo.stargazerCount,
  forks: repo.forkCount,

  language: repo.primaryLanguage?.name || "Unknown",
  color: repo.primaryLanguage?.color || "#586069",

  image: repo.openGraphImageUrl
}));


  return generateTable(repos);
}

function generateTable(repos) {

  let html = `
<table width="100%" cellspacing="12" cellpadding="0">
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

<table width="100%" cellspacing="0" cellpadding="14" style="border:1px solid #30363d;">

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

<img src="https://img.shields.io/badge/${encodeURIComponent(repo.language)}-${repo.color.replace("#","")}?style=flat-square">

<img src="https://img.shields.io/badge/⭐-${repo.stars}-yellow?style=flat-square">

<img src="https://img.shields.io/badge/🍴-${repo.forks}-blue?style=flat-square">

</p>

<p>

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
<a href="${repo.homepage}" target="_blank">
<img src="https://img.shields.io/badge/🌐-Live_Demo-2ea44f?style=for-the-badge&logo=google-chrome&logoColor=white">
</a>
` : ""}

<a href="${repo.url}" target="_blank">
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


  let readme = fs.readFileSync(readmePath, "utf8");


  const start = "<!--START_PINNED-->";
  const end = "<!--END_PINNED-->";



  const newSection = `
${start}

${repoCards}

${end}
`;



  readme = readme.replace(
    new RegExp(`${start}[\\s\\S]*?${end}`),
    newSection
  );



  fs.writeFileSync(readmePath, readme);


  console.log("README updated successfully ✅");

}



updateReadme();
