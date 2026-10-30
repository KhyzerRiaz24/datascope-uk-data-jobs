# GitHub publishing pack

## Repository details to copy

**Suggested repository name:** `datascope-uk-data-jobs`

**Owner:** `KhyzerRiaz24`

**About description:**

UK data jobs analytics portfolio: Python ingestion, DuckDB and SQL, data-quality
checks, and a dashboard for roles, skills and advertised salary ranges. Synthetic demo.

**Suggested topics:**

`python` `sql` `duckdb` `data-analytics` `data-engineering` `etl` `dashboard`
`data-visualization` `javascript` `github-actions` `portfolio-project`
`job-market-analysis`

The name and addresses below are proposed publication targets. This preparation
does not create a GitHub repository, upload code or change the private Sites demo.
Only describe the links as live after GitHub confirms publication.

- Expected repository: https://github.com/KhyzerRiaz24/datascope-uk-data-jobs
- Expected Pages demo: https://khyzerriaz24.github.io/datascope-uk-data-jobs/
- Current private owner preview: https://uk-data-jobs-khyzer.perkyyak20.chatgpt.site

Do not use the private owner-preview link as a public recruiter demo.

## Option A: upload the prepared source ZIP through GitHub

1. Unzip the source download. Open the inner `uk-data-jobs` folder.
2. Create a new GitHub repository using the suggested name. Choose Public if
   you want recruiters to browse the source. Leave the initial README, licence
   and .gitignore options unchecked: the project already includes those files.
3. In the empty repository, choose the option to upload existing files. Upload
   the contents of `uk-data-jobs`, rather than an extra containing folder.
4. Include `.github/`, `.gitignore` and `.env.example`. On a Mac, Command+Shift+.
   reveals hidden files in Finder. `.env.example` contains names, not API keys.
5. Commit the upload to `main`. Check that README.md displays the screenshots
   and that the Project checks workflow starts.
6. Copy the About description and topics above into the repository sidebar.

The release ZIP excludes local dependencies, databases, credentials, test output,
generated hosting output and Git history. Its included sample dataset is synthetic.
Do not upload your complete working folder with `.venv/` or `node_modules/`.

## Option B: use the existing local Git project

Create an empty GitHub repository first. From the local project folder, use:

The prepared working copy already has a local commit containing this material.
If `git status` is clean, skip the `git add` and `git commit` commands below.

```sh
git status
git add README.md docs scripts package.json .github/workflows/checks.yml
git commit -m "Prepare DataScope portfolio and publishing material"
git remote add github https://github.com/KhyzerRiaz24/datascope-uk-data-jobs.git
git push github HEAD:main
```

Check existing remotes before adding one. If the named `github` remote already
exists, inspect and reuse it when it points to the intended repository. Never
paste a token into a command or overwrite a different project's remote.

## Enable the free public demonstration

The dashboard is a static site. GitHub Pages can serve its prepared files;
Python collection and DuckDB do not run inside GitHub Pages.

1. In the new repository, open Settings → Pages.
2. Under Build and deployment, choose GitHub Actions as the source.
3. Open Settings → Secrets and variables → Actions → Variables.
4. Create `ENABLE_GITHUB_PAGES` with value `true`.
5. Open Actions → Project checks → Run workflow and choose `main`.
6. Wait for both `test` and `deploy` to finish successfully. Open the actual
   deployment URL returned by GitHub, including the project-name path.

The workflow runs the pipeline tests, calculation tests, browser/accessibility
checks, SQL reports and static packaging before Pages deployment. Pull requests
run checks but cannot deploy. The deployment job has Pages permissions; the test
job keeps read-only permissions.

Only turn on `ENABLE_DAILY_REFRESH` if you also configure real data collection.
That is a separate option from `ENABLE_GITHUB_PAGES`. The collection workflow
saves data artifacts and does not automatically replace the public demo dataset.

## Finish the repository presentation

After the actual Pages URL is verified:

- Set the repository's Website field to the verified public demo URL.
- Add the source and demo links at the top of README.md.
- Optionally add the Project checks badge using this repository's actual URL.
- Upload `docs/images/overview-desktop.png` as an optional social preview image,
  checking GitHub's crop before saving it.
- Use docs/LINKEDIN.md for the post and project entry. Add the verified URLs
  before publishing the post. The draft itself makes no live-data claims.

GitHub's official workflow guidance:
https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
