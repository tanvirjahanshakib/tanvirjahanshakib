const username = "tanvirjahanshakib";

async function getRepos() {
  const response = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated`
  );

  const data = await response.json();

  const repos = data.map(repo => ({
    name: repo.name,
    description: repo.description,
    url: repo.html_url,
    homepage: repo.homepage
  }));

  return generateTable(repos);
}


function generateTable(repos) {
  let html = `
<table width="100%" style="table-layout:fixed;">
<tbody>
`;

  for (let i = 0; i < repos.length; i += 2) {

    html += `<tr>`;

    for (let j = i; j < i + 2; j++) {

      if (repos[j]) {

        const repo = repos[j];

        html += `
<td width="50%" valign="top" style="width:50%; padding:10px;">

<table width="100%" style="border:1px solid #30363d; border-radius:10px;">
<tr>
<td style="padding:20px;">

<h3>
📦 <a href="${repo.url}">
${repo.name}
</a>
</h3>

<p>
${repo.description || "_No description available._"}
</p>

<p>
🔗 <a href="${repo.url}">
View Repository
</a>
</p>

${repo.homepage ? `
<p>
🌐 <a href="${repo.homepage}">
Live Demo
</a>
</p>
` : ""}

</td>
</tr>
</table>

</td>
`;

      } else {

        html += `
<td width="50%"></td>
`;

      }
    }

    html += `</tr>`;
  }

  html += `
</tbody>
</table>
`;

  return html;
}


// Generate README content
getRepos().then(repoCards => {
  console.log(repoCards);
});
