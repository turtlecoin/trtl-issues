function fixDate(date) {
	return date.slice(0, date.indexOf('T'))
}

function spinner(status) {
	let loader = document.querySelector('#con')
	if (status) {
		loader.classList.add('con')
		loader.innerHTML = `<div class="loader"></div>`
	} else {
		loader.classList.remove('con')
		loader.innerHTML = ''
		$("body").css("overflow-y", "scroll");
	}
}

function createRepoHeaderHTML(repo, numIssues) {
    const repoHeader = document.createElement('div');
    repoHeader.className = 'card-header';

    const header = document.createElement('h3');
    header.className = 'card-title';

    const headerText = document.createTextNode(repo.full_name);

    const span = document.createElement('span');
    span.className = 'badge badge-pill bg-green'
    span.innerText = numIssues;

    header.appendChild(headerText);
    header.appendChild(span);

    repoHeader.appendChild(header);

    return repoHeader;
}

function createCommentSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    svg.setAttribute('class', 'icon');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    path1.setAttribute('d', 'M0 0h24v24H0z');
    path1.setAttribute('stroke', 'none');
    path2.setAttribute('d', 'M4 21v-13a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-9l-4 4');

    line1.setAttribute('x1', '8');
    line1.setAttribute('x2', '16');
    line1.setAttribute('y1', '9');
    line1.setAttribute('y2', '9');

    line2.setAttribute('x1', '8');
    line2.setAttribute('x2', '14');
    line2.setAttribute('y1', '13');
    line2.setAttribute('y2', '13');

    svg.appendChild(path1);
    svg.appendChild(path2);
    svg.appendChild(line1);
    svg.appendChild(line2);

    return svg;
}

async function fetchRepoIssues(repo) {
    const issueRes = await fetch(`https://api.github.com/repos/turtlecoin/${repo.name}/issues`);

    const issues = (await issueRes.json()).filter((i) => !i.pull_request);

    if (issues.length === 0) {
        return;
    }

    const repoDiv = document.createElement('div');
    repoDiv.id = repo.name;
    repoDiv.className = 'card';
    repoDiv.appendChild(createRepoHeaderHTML(repo, issues.length));

    const issuesDiv = document.createElement('div');
    issuesDiv.className = 'list list-row list-hoverable';

    const svg = createCommentSVG();

    for (const issue of issues) {
        const listItemDiv = document.createElement('div');
        listItemDiv.className = 'list-item';
        issuesDiv.appendChild(listItemDiv)

        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';

        const issueLink = document.createElement('a');
        issueLink.href = issue.html_url;
        issueLink.target = '_blank';
        issueLink.className = 'text-body h4 d-inline-block mb-0';
        issueLink.dataset.toggle = 'tooltip';
        issueLink.dataset.placement = 'top';
        issueLink.title = issue.body;
        issueLink.textContent = issue.title;
        itemDiv.appendChild(issueLink);

        for (const label of issue.labels) {
            const labelDiv = document.createElement('div');
            labelDiv.className = 'item-labels d-inline-block p-0';

            const span = document.createElement('span');
            span.className = 'badge';
            span.style = `background-color: #${label.color};`;
            span.textContent = label.name;

            labelDiv.appendChild(span);

            itemDiv.appendChild(labelDiv);
        }

        /* Probably done better in CSS... */
        const small = document.createElement('small');
        small.className = 'd-block text-muted mt-n1';
        small.textContent = `${issue.number} opened on ${fixDate(issue.created_at)} by ${issue.user.login}`;
        itemDiv.appendChild(small);

        listItemDiv.appendChild(itemDiv);

        const issueCommentsLink = document.createElement('a');
        issueCommentsLink.href = issue.html_url;
        issueCommentsLink.target = '_blank';
        issueCommentsLink.className = issue.comments > 0
            ? 'list-item-actions show'
            : 'd-none';

        issueCommentsLink.appendChild(svg);
        issueCommentsLink.appendChild(document.createTextNode(issue.comments));

        listItemDiv.appendChild(issueCommentsLink);
        issuesDiv.appendChild(listItemDiv);
    }

    repoDiv.appendChild(issuesDiv);

    return {
        repoIssues: repoDiv,
        count: issues.length,
    };
}

async function loadGithubIssues() {
    try {
        const res = await fetch('https://api.github.com/orgs/turtlecoin/repos?sort=updated');

        const repos = await res.json();

        const mainDiv = document.getElementById('main');
        const sidebar = document.querySelector('.list-unstyled');
        const bodySideBar = document.querySelector('.sticky-top');
        const title = document.querySelector('.page-title');

        bodySideBar.style.display = 'none';

        let issues = 0;

        for (const repo of repos) {
            fetchRepoIssues(repo).then(({ repoIssues, count }) => {
                if (repoIssues) {
                    mainDiv.appendChild(repoIssues);

                    const sidebarItem = document.createElement('li');
                    sidebarItem.className = 'toc-entry toc-h2';

                    const repoLink = document.createElement('a');
                    repoLink.href = `#${repo.name}`;
                    repoLink.textContent = repo.name;

                    sidebarItem.appendChild(repoLink);

                    sidebar.appendChild(sidebarItem);

                    issues += count;

                    title.innerText = `${issues} Open Issues`;
                }
            });
        }

        bodySideBar.style.display = 'block';
		$('[data-toggle="tooltip"]').tooltip();
    } catch (err) {
        alert(`Failed to fetch data: ${err.toString()}`);
    }
}

window.addEventListener('load', loadGithubIssues);
