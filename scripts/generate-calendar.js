const fs = require("fs");

const username = "tanvirjahanshakib";

const token = process.env.GH_TOKEN;

async function getContributions() {
  const query = `
  query {
    user(login: "${username}") {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
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
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const data = await response.json();

  return data.data.user.contributionsCollection
    .contributionCalendar;
}


function createSVG(calendar) {

const colors = [
 "#161b22",
 "#0e4429",
 "#006d32",
 "#26a641",
 "#39d353"
];


let boxes = "";

let x = 20;
let y = 40;


calendar.weeks.forEach(week => {

 week.contributionDays.forEach(day => {

 let level = 0;

 if(day.contributionCount > 0) level = 1;
 if(day.contributionCount > 3) level = 2;
 if(day.contributionCount > 6) level = 3;
 if(day.contributionCount > 10) level = 4;


 boxes += `
 <rect
 x="${x}"
 y="${y}"
 width="12"
 height="12"
 rx="3"
 fill="${colors[level]}"
 >
 <title>
 ${day.date}: ${day.contributionCount} contributions
 </title>
 </rect>
 `;

 x += 16;

 });


 y += 16;
 x = 20;

});


return `
<svg width="900" height="220"
xmlns="http://www.w3.org/2000/svg">

<rect width="100%" height="100%"
fill="#0d1117"/>

<text
x="20"
y="25"
fill="white"
font-size="18"
font-family="Arial">
${username}'s Contribution Calendar
</text>

${boxes}

</svg>
`;

}



(async()=>{

const calendar = await getContributions();

const svg = createSVG(calendar);


fs.writeFileSync(
"assets/contribution.svg",
svg
);

console.log("Contribution Calendar Updated");

})();
