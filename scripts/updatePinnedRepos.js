const fs = require("fs");

const username = "tanvirjahanshakib";


async function getPinnedRepos() {

  const query = `
  query {
    user(login: "${username}") {
      pinnedItems(first: 12, types: REPOSITORY) {
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
            }
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


  if(result.errors){
    console.log(result.errors);
    process.exit(1);
  }


  const repos = result.data.user.pinnedItems.nodes.map(repo => ({
    name: repo.name,
    description: repo.description,
    url: repo.url,
    homepage: repo.homepageUrl,
    stars: repo.stargazerCount,
    forks: repo.forkCount,
    language: repo.primaryLanguage?.name || "Code"
  }));


  return generateTable(repos);
}





function getLanguageIcon(language){

  const icons = {
    JavaScript:"🟨",
    TypeScript:"🔵",
    Python:"🐍",
    Java:"☕",
    React:"⚛️",
    Vue:"🟢",
    PHP:"🟣",
    HTML:"🟠",
    CSS:"🎨"
  };


  return icons[language] || "💻";

}





function generateTable(repos) {


let html = `

<table width="50%">
<tbody>

`;


for(let i=0;i<repos.length;i+=2){

html += `<tr>`;

for(let j=i;j<i+2;j++){

if(repos[j]){

const repo = repos[j];

html += `

<td width="50%" valign="top" style="padding:5px;">


<table width="150%" 
style="
border:0px solid #30363d;
border-radius:15px;
">

<tr>

<td style="padding:20px;">


<h3>

📦 
<a href="${repo.url}">
${repo.name}
</a>

</h3>



<p>
${repo.description || "No description available."}
</p>



<p>

${getLanguageIcon(repo.language)}
${repo.language}

&nbsp;&nbsp;

⭐ ${repo.stars}

&nbsp;&nbsp;

🍴 ${repo.forks}

</p>
<a href="${repo.url}">
<img src="https://img.shields.io/badge/Repository-181717?style=for-the-badge&logo=github&logoColor=white">
</a>

${repo.homepage ? `

<a href="${repo.homepage}">
<img src="https://img.shields.io/badge/Live_Project-00C7B7?style=for-the-badge&logo=googlechrome&logoColor=white">
</a>

`:""}


</td>

</tr>

</table>


</td>


`;



}else{


html += `<td width="50%"></td>`;

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







async function updateReadme(){


const repoCards = await getPinnedRepos();



const readmePath="README.md";


let readme = fs.readFileSync(
readmePath,
"utf8"
);



const start="<!--START_PINNED-->";
const end="<!--END_PINNED-->";



const newSection = `

${start}

${repoCards}

${end}

`;



const regex = new RegExp(
`${start}[\\s\\S]*?${end}`
);



readme = readme.replace(
regex,
newSection
);



fs.writeFileSync(
readmePath,
readme
);



console.log(
"README updated successfully ✅"
);


}



updateReadme();
