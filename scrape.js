// from https://github.com/JasonEtco/readme-guestbook/blob/master/api/submit-form.ts
const { Octokit } = require("@octokit/rest");

// todo: use readme-box instead if it no-ops nicely
// const { ReadmeBox } = require('readme-box')


const REPO_DETAILS = {
  owner: process.env.CI_REPOSITORY_OWNER,
  repo: process.env.CI_REPOSITORY_OWNER,
};

const START_COMMENT = "<!--START_SECTION:endorsements-->";
const END_COMMENT = "<!--END_SECTION:endorsements-->";
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`);

// console.log({ REPO_DETAILS });
// console.log("ghtoken", process.env.ENV_GITHUB_TOKEN);

const octokit = new Octokit({ auth: `token ${process.env.ENV_GITHUB_TOKEN}` });
(async function main() {
  const readme = await getReadme(octokit);
  let oldFences = listReg.exec(readme.content)
  oldFences = oldFences && oldFences[0] // could be null
  const data = await getReactions();
  try {
    let listWithFences = generateStuffInsideFences(data, readme.content);
    if (listWithFences === oldFences) {
      console.log('NO CHANGE detected in the endorsements, skipping commit')
      return 
    }
    let newContents = readme.content.replace(listReg, listWithFences);
    await octokit.repos.createOrUpdateFileContents({
      ...REPO_DETAILS,
      content: Buffer.from(newContents).toString("base64"),
      path: "README.md",
      message: `endorsements ${new Date().toISOString()}`,
      sha: readme.sha,
      branch: "master",
    });
  } catch (err) {
    console.error(err);
  }
})();

/**
 *
 *
 *
 *
 *
 */

function generateStuffInsideFences(data) {
  const renderedList = data
    .map(
      (x) =>
        `<li><a href="${x.url}">${x.title.replace(/<style[^>]*>.*<\/style>/gm, '')
    // Remove script tags and content
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    // Remove all opening, closing and orphan HTML tags
    .replace(/<[^>]+>/gm, '')
    // Remove leading spaces and repeated CR/LF
    .replace(/([\r\n]+ +)+/gm, '')}</a>: ${x.reactions
          .map(
            (reaction) => `<img src=${reaction.user.avatar_url}&s=20 height=20 />` // use github image api s=20 to size smaller
          )
          .join("")}</li>`
    )
    .join("\n");

  const listWithFences = `${START_COMMENT}
  ### Skills & Endorsements
  
  I would like to add you to my professional network on the GITHUB.

  <ul>
  ${renderedList}
  <li><a href="https://github.com/sw-yx/sw-yx/issues/new?assignees=&labels=&template=endorsement-template.md&title=Endorse%3A+SKILL_HERE">Endorse new skill!</a></li>
  </ul>
  ${END_COMMENT}`;
  return listWithFences
}

// async function getReadme (octokit: Octokit) {
async function getReadme(octokit) {
  const res = await octokit.repos.getReadme(REPO_DETAILS);
  const encoded = res.data.content;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  return {
    content: decoded,
    sha: res.data.sha,
  };
}
async function getReactions() {
  let { data } = await octokit.issues.listForRepo(REPO_DETAILS);
  data = data
    .filter((x) => x.title.startsWith("Endorse: "))
    .map((x) => ({ ...x, title: x.title.slice(9) }));
  data = await Promise.all(
    data.map(async (x) => {
      const reaction = await octokit.reactions.listForIssue({
        ...REPO_DETAILS,
        issue_number: x.number,
      });
      return {
        title: x.title,
        url: x.html_url,
        number: x.number,
        reactions: reaction.data, // an array of USER
      };
    })
  );
  return data; // custom object
}
