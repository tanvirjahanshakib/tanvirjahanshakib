function generateTable(repos) {

  let html = `
<table width="100%" style="
border-collapse:separate;
border-spacing:20px;
table-layout:fixed;
">
<tbody>
`;


  for (let i = 0; i < repos.length; i += 2) {

    html += `<tr>`;


    for (let j = i; j < i + 2; j++) {


      if (repos[j]) {

        const repo = repos[j];


        html += `
<td width="50%" valign="top">


<div style="
border:1px solid #30363d;
border-radius:12px;
padding:18px;
height:240px;
display:flex;
flex-direction:column;
justify-content:space-between;
">


<div>


<h3 style="
margin:0;
height:35px;
overflow:hidden;
font-size:18px;
">

📦 
<a href="${repo.url}" target="_blank">
${repo.name}
</a>

</h3>



<div style="
height:85px;
overflow:hidden;
margin-top:12px;
">

<p>
${repo.description || "_No description available._"}
</p>


</div>


</div>





<div style="
display:flex;
gap:10px;
align-items:center;
">


<a href="${repo.url}" target="_blank">

<img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white">

</a>



${repo.homepage ? `

<a href="${repo.homepage}" target="_blank">

<img src="https://img.shields.io/badge/Live-Demo-38BDF8?style=for-the-badge&logo=googlechrome&logoColor=white">

</a>

` : ""}


</div>



</div>


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
