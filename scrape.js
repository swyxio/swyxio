const { Octokit } =  require('@octokit/rest')

// from https://github.com/JasonEtco/readme-guestbook/blob/master/api/submit-form.ts
const REPO_DETAILS = {
  owner: process.env.REPO_OWNER,
  repo: process.env.REPO_OWNER
}

const START_COMMENT = '<!--START_SECTION:endorsements-->'
const END_COMMENT = '<!--END_SECTION:endorsements-->'
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`)

// async function getReadme (octokit: Octokit) {
async function getReadme (octokit) {
  const res = await octokit.repos.getReadme(REPO_DETAILS)
  const encoded = res.data.content
  const decoded = Buffer.from(encoded, 'base64').toString('utf8')
  return {
    content: decoded,
    sha: res.data.sha
  }
}


// function generateNewReadme (guests: Guest[], readme: string) {
//   const renderedList = renderList(guests)
//   const listWithFences = `${START_COMMENT}\n${renderedList}\n${END_COMMENT}`
//   const newContent = readme
//     .replace(listReg, listWithFences)
//     // .replace(jsonReg, `<!--GUESTBOOK_LIST ${JSON.stringify(guests)}-->`)
//   return Buffer.from(newContent).toString('base64')
// }

console.log('ghtoken', process.env.GITHUB_TOKEN)

const octokit = new Octokit({ auth: `token ${process.env.GITHUB_TOKEN}` });
(async function potato() {

  const readme = await getReadme(octokit)
})()


// try {
//   const newContents = generateNewReadme(newList, readme.content)

//   await octokit.repos.createOrUpdateFile({
//     ...REPO_DETAILS,
//     content: newContents,
//     path: 'README.md',
//     message: `endorsementsssssss`,
//     sha: readme.sha,
//     branch: 'master'
//   })
// } catch (err) {
//   console.error(err)
// }