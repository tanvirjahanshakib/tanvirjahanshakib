function generateTable(repos) {
  let html = `<table>`;

  for (let i = 0; i < repos.length; i += 2) {
    html += `<tr>`;

    for (let j = i; j < i + 2; j++) {
      if (repos[j]) {
        const repo = repos[j];

        html += `
<td width="50%" valign="top">

<a href="${repo.url}">
<h3>📦 ${repo.name}</h3>
</a>

<p>${repo.description ?? "No description available."}</p>

</td>
`;
      } else {
        html += `<td width="50%"></td>`;
      }
    }

    html += `</tr>`;
  }

  html += `</table>`;

  return html;
}
