function generateTable(repos) {
  let html = `<table width="100%">`;

  for (let i = 0; i < repos.length; i += 2) {
    html += `<tr>`;

    for (let j = i; j < i + 2; j++) {
      if (repos[j]) {
        const repo = repos[j];

        html += `
<td width="49%" valign="top">

### 📦 <a href="${repo.url}">${repo.name}</a>

${repo.description || "_No description available._"}

</td>
`;
      } else {
        html += `<td width="49%"></td>`;
      }
    }

    html += `</tr>`;
  }

  html += `</table>`;

  return html;
}
