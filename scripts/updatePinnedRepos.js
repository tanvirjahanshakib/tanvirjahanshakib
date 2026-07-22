const fs = require("fs");

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
<td width="50%" valign="top" style="
width:50%;
padding:10px;
">


<table width="100%" style="
border:1px solid #30363d;
border-radius:12px;
height:330px;
">


<tr>

<td style="
padding:20px;
vertical-align:top;
">


<div style="
height:270px;
display:flex;
flex-direction:column;
">


<div>


<h3 style="
margin:0;
height:35px;
overflow:hidden;
">

📦 
<a href="${repo.url}" target="_blank">
${repo.name}
</a>

</h3>



<div style="
height:100px;
overflow:hidden;
margin-top:10px;
">

<p>
${repo.description || "_No description available._"}
</p>


</div>


</div>





<div style="
margin-top:auto;
">


<p>
🔗 
<a href="${repo.url}" target="_blank">
View Repository
</a>
</p>




${repo.homepage ? `
<p>
🌐 
<a href="${repo.homepage}" target="_blank">
Live Link
</a>
</p>
` : ""}



</div>



</div>


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
