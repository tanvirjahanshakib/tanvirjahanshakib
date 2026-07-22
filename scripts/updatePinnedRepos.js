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
📦 <a href="${repo.homepage}">
${repo.name}
</a>
</h3>
${repo.homepage ? `
<p>
🌐 <a href="${repo.homepage}">
Live Demo
</a>
</p>
` : ""}
<p>
${repo.description || "_No description available._"}
</p>

<p>
🔗 <a href="${repo.homepage}">
View Repository
</a>
</p>

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
