function generateTable(repos) {

  let html = `
<table width="100%" style="
border-collapse:separate;
border-spacing:24px;
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
padding:20px;
height:220px;
display:flex;
flex-direction:column;
justify-content:space-between;
box-sizing:border-box;
">


<div>


<h3 style="
margin:0;
font-size:18px;
height:35px;
overflow:hidden;
">

📦 
<a href="${repo.url}" target="_blank">
${repo.name}
</a>

</h3>



<p style="
height:70px;
overflow:hidden;
margin-top:15px;
">

${repo.description || "_No description available._"}

</p>


</div>




<div>


<a href="${repo.url}" target="_blank">

<img src="https://img.shields.io/badge/Repository-View-181717?style=for-the-badge&logo=github">

</a>



${repo.homepage ? `

<a href="${repo.homepage}" target="_blank">

<img src="https://img.shields.io/badge/Live-Link-38BDF8?style=for-the-badge&logo=googlechrome">

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
