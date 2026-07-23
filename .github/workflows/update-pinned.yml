function generateTable(repos) {

let html = `
<table width="100%">
<tbody>
`;



for(let i = 0; i < repos.length; i += 2){

html += `<tr>`;


for(let j = i; j < i + 2 && j < repos.length; j++){


const repo = repos[j];


html += `

<td width="50%" valign="top" style="padding:10px;">


<table width="100%" height="260"
style="
border:1px solid #30363d;
border-radius:15px;
">

<tr>

<td style="
padding:20px;
vertical-align:top;
height:260px;
">


<div style="
height:220px;
display:flex;
flex-direction:column;
justify-content:space-between;
">


<div>


<h3 style="
margin-top:0;
">

📦 
<a href="${repo.url}">
${repo.name}
</a>

</h3>



<p style="
height:60px;
overflow:hidden;
">

${repo.description || "No description available."}

</p>



<p>

${getLanguageIcon(repo.language)}
${repo.language}

&nbsp;

⭐ ${repo.stars}

&nbsp;

🍴 ${repo.forks}

</p>


</div>



<div>


<a href="${repo.url}">
<img src="https://img.shields.io/badge/Repository-181717?style=for-the-badge&logo=github">
</a>


${repo.homepage ? `

<a href="${repo.homepage}">
<img src="https://img.shields.io/badge/Live_Project-00C7B7?style=for-the-badge&logo=googlechrome">
</a>

`: ""}



</div>


</div>


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
