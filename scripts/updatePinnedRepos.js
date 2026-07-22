const username = "tanvirjahanshakib";

async function getPinnedRepos() {

  const query = `
  query {
    user(login: "${username}") {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            homepageUrl
          }
        }
      }
    }
  }
  `;


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
    description: repo.description,
    url: repo.url,
    homepage: repo.homepageUrl
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
getPinnedRepos().then(repoCards => {
  console.log(repoCards);
});
