/**
 * updatePinnedRepos.js
 * ---------------------------------------------------------
 * Auto update GitHub pinned repositories into README.md
 * Premium GitHub dark card layout
 * ---------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const https = require("https");


const README_PATH = path.join(process.cwd(), "README.md");

const START_MARKER = "<!--START_PINNED-->";
const END_MARKER = "<!--END_PINNED-->";


const MAX_REPOS = 6;
const CARDS_PER_ROW = 2;

const IMAGE_WIDTH = 420;
const DESCRIPTION_MAX_LEN = 95;


const GH_TOKEN =
  process.env.GH_TOKEN ||
  process.env.GITHUB_TOKEN;


const GH_LOGIN =
  process.env.GH_LOGIN ||
  process.env.GITHUB_REPOSITORY_OWNER;



if (!GH_TOKEN) {
  console.error("❌ Missing GH_TOKEN");
  process.exit(1);
}


if (!GH_LOGIN) {
  console.error("❌ Missing GH_LOGIN");
  process.exit(1);
}




const QUERY = `
query ($login: String!, $count: Int!) {

  user(login: $login) {

    pinnedItems(
      first: $count,
      types: [REPOSITORY]
    ) {

      nodes {

        ... on Repository {

          name
          description

          url
          homepageUrl

          stargazerCount
          forkCount

          openGraphImageUrl


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





function graphqlRequest(query, variables) {


  const payload = JSON.stringify({
    query,
    variables
  });



  const options = {

    hostname: "api.github.com",

    path: "/graphql",

    method: "POST",


    headers: {

      "Content-Type":
        "application/json",

      Authorization:
        `bearer ${GH_TOKEN}`,

      "User-Agent":
        "Pinned-Repo-Updater",

      Accept:
        "application/vnd.github+json",


      "Content-Length":
        Buffer.byteLength(payload)

    }

  };





  return new Promise((resolve,reject)=>{


    const req = https.request(
      options,
      res=>{


        let data="";


        res.on(
          "data",
          chunk=>data+=chunk
        );



        res.on(
          "end",
          ()=>{


            if(
              res.statusCode < 200 ||
              res.statusCode >=300
            ){

              reject(
                new Error(
                  `GitHub API Error ${res.statusCode}`
                )
              );

              return;

            }




            try{


              const json =
                JSON.parse(data);



              if(json.errors){

                reject(
                  new Error(
                    JSON.stringify(
                      json.errors
                    )
                  )
                );

                return;

              }



              resolve(json.data);


            }
            catch(err){

              reject(err);

            }


          }
        );


      }
    );



    req.on(
      "error",
      reject
    );


    req.write(payload);

    req.end();


  });


}







function escapeHtml(str=""){


return str

.replace(/&/g,"&amp;")

.replace(/</g,"&lt;")

.replace(/>/g,"&gt;")

.replace(/"/g,"&quot;");


}







function truncateDescription(desc){


if(!desc)

return "No description provided.";



const clean =
desc.trim()
.replace(/\s+/g," ");



if(
clean.length <= DESCRIPTION_MAX_LEN
)

return clean;



return (
clean
.slice(
0,
DESCRIPTION_MAX_LEN
)
.replace(/\s+\S*$/,"")
+"…"
);


}







function shield(text){


return encodeURIComponent(
String(text)
)

.replace(/-/g,"--")

.replace(/_/g,"__");


}







function languageBadge(lang){


if(!lang || !lang.name){


return `![Language](https://img.shields.io/badge/Language-Unknown-8b949e?style=flat-square)`;


}



const color =
(lang.color || "#8b949e")
.replace("#","");



return `![${lang.name}](https://img.shields.io/badge/-${shield(
lang.name
)}-${color}?style=flat-square&logo=github&logoColor=white)`;

}





function statBadge(label,value,color){


return `![${label}](https://img.shields.io/badge/${shield(label)}-${value}-${color}?style=flat-square)`;


}





function repoButton(url){


return `[![Repository](https://img.shields.io/badge/GitHub-Repository-161b22?style=for-the-badge&logo=github)](${url})`;


}





function demoButton(url){


return `[![Live Demo](https://img.shields.io/badge/Live-Demo-238636?style=for-the-badge&logo=vercel)](${url})`;


}
