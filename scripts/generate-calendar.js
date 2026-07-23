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
      body: JSON.stringify({
        query
      }),
    }
  );


  const result = await response.json();


  if (result.errors) {
    console.log(result.errors);
    throw new Error("GitHub API Error");
  }


  return result.data.user
    .contributionsCollection
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


let svgBoxes = "";

let x = 40;
let y = 70;


calendar.weeks.forEach((week)=>{


  week.contributionDays.forEach((day)=>{


    let level = 0;


    if(day.contributionCount > 0)
      level = 1;

    if(day.contributionCount > 3)
      level = 2;

    if(day.contributionCount > 6)
      level = 3;

    if(day.contributionCount > 10)
      level = 4;



    svgBoxes += `

    <rect
      x="${x}"
      y="${y}"
      width="14"
      height="14"
      rx="3"
      fill="${colors[level]}"
    >

    <title>
    ${day.date}
    : ${day.contributionCount} contributions
    </title>

    </rect>

    `;


    x += 18;


  });


  y += 18;
  x = 40;


});



return `

<svg 
width="1000"
height="260"
viewBox="0 0 1000 260"
xmlns="http://www.w3.org/2000/svg">


<rect
width="100%"
height="100%"
rx="20"
fill="#0d1117"
/>



<text
x="40"
y="40"
fill="#ffffff"
font-size="22"
font-family="Arial"
font-weight="bold">

${username}'s Contribution Calendar

</text>



${svgBoxes}



<text
x="40"
y="245"
fill="#8b949e"
font-size="14"
font-family="Arial">

Less

</text>



<rect x="90" y="232" width="14" height="14" rx="3" fill="#161b22"/>
<rect x="110" y="232" width="14" height="14" rx="3" fill="#0e4429"/>
<rect x="130" y="232" width="14" height="14" rx="3" fill="#006d32"/>
<rect x="150" y="232" width="14" height="14" rx="3" fill="#26a641"/>
<rect x="170" y="232" width="14" height="14" rx="3" fill="#39d353"/>


<text
x="200"
y="245"
fill="#8b949e"
font-size="14"
font-family="Arial">

More

</text>


</svg>

`;

}



(async()=>{


try {


const calendar = await getContributions();


const svg = createSVG(calendar);



if(!fs.existsSync("assets")){
  fs.mkdirSync("assets");
}



fs.writeFileSync(
  "assets/contribution.svg",
  svg
);



console.log(
  "✅ Contribution Calendar Updated"
);



}

catch(error){

console.error(
"❌ Failed:",
error.message
);

process.exit(1);

}



})();
