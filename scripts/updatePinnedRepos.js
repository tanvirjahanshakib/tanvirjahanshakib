function generateTable(repos) {
  let html = `
<table width="100%" style="table-layout: fixed;">
<tbody>
`;

  for (let i = 0; i < repos.length; i += 2) {
    html += `<tr>`;

    for (let j = i; j < i + 2; j++) {

      if (repos[j]) {
        const repo = repos[j];

        html += `
<td width="50%" valign="top" style="width:50%; padding:20px;">

<h3>
📦 <a href="${repo.url}">
${repo.name.length > 25 
? repo.name.substring(0, 25) + "..." 
: repo.name}
</a>
</h3>

<p>
${repo.description || "_No description available._"}
</p>

</td>
`;

      } else {

        html += `
<td width="50%" valign="top" style="width:50%; padding:20px;">
</td>
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
