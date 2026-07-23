const fs = require("fs");
const path = require("path");

const username = process.env.GITHUB_USERNAME;
const token = process.env.GITHUB_TOKEN;

if (!username || !token) {
  console.error("Missing GITHUB_USERNAME or GITHUB_TOKEN");
  process.exit(1);
}


async function fetchPinnedRepos() {
  const query = `
    query($login:String!) {
      user(login:$login) {
        pinnedItems(first:12, types:REPOSITORY) {
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
      headers:{
        "Authorization": `Bearer ${token}`,
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        query,
        variables:{
          login: username
        }
      })
    }
  );


  const data = await response.json();


  if(data.errors){
    console.error(data.errors);
    process.exit(1);
  }


  return data.data.user.pinnedItems.nodes;
}



function languageEmoji(language){

  const map = {
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


  return map[language] || "💻";
}



function createCard(repo){


  const lang = repo.primaryLanguage
    ? repo.primaryLanguage.name
    : "Code";


  const live =
    repo.homepageUrl
    ? `
<a href="${repo.homepageUrl}">
<img src="https://img.shields.io/badge/Live_Demo-00C7B7?style=for-the-badge&logo=vercel&logoColor=white"/>
</a>
`
    : "";


  return `
<td width="50%" valign="top">

<h3>📦 ${repo.name}</h3>

<p>
${repo.description || "A modern software project."}
</p>


<p>
${languageEmoji(lang)} ${lang}
&nbsp;
⭐ ${repo.stargazerCount}
&nbsp;
🍴 ${repo.forkCount}
</p>


<a href="${repo.url}">
<img src="https://img.shields.io/badge/Repository-181717?style=for-the-badge&logo=github&logoColor=white"/>
</a>

${live}


</td>
`;
}



function generateHTML(repos){


 let html = `
<table>
`;


 for(let i=0;i<repos.length;i+=2){

   html += "<tr>";

   html += createCard(repos[i]);


   if(repos[i+1]){
     html += createCard(repos[i+1]);
   }
   else{
     html += "<td></td>";
   }


   html += "</tr>\n";

 }


 html += `
</table>
`;


 return html;

}




function updateReadme(content){


 const readmePath =
 path.join(process.cwd(),"README.md");


 let readme =
 fs.readFileSync(
  readmePath,
  "utf8"
 );


 const start =
 "<!-- PROJECTS_START -->";


 const end =
 "<!-- PROJECTS_END -->";



 const regex =
 new RegExp(
 `${start}[\\s\\S]*?${end}`,
 "m"
 );


 const updated =
 `${start}

${content}

${end}`;



 if(!regex.test(readme)){
   console.error(
    "README markers not found"
   );
   process.exit(1);
 }


 readme =
 readme.replace(
  regex,
  updated
 );


 fs.writeFileSync(
  readmePath,
  readme
 );


 console.log(
  "README updated successfully 🚀"
 );

}





async function main(){

 const repos =
 await fetchPinnedRepos();


 const html =
 generateHTML(repos);


 updateReadme(html);

}



main();
