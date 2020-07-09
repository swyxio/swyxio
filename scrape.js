const { Octokit } = require("@octokit/rest");

// from https://github.com/JasonEtco/readme-guestbook/blob/master/api/submit-form.ts
const REPO_DETAILS = {
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  repo: process.env.GITHUB_REPOSITORY_OWNER,
};

const START_COMMENT = "<!--START_SECTION:endorsements-->";
const END_COMMENT = "<!--END_SECTION:endorsements-->";
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`);

console.log({ REPO_DETAILS });
console.log("ghtoken", process.env.ENV_GITHUB_TOKEN);

const octokit = new Octokit({ auth: `token ${process.env.ENV_GITHUB_TOKEN}` });
(async function main() {
  const readme = await getReadme(octokit);
  const data = await getReactions();
  try {
    const newContents = generateNewReadme(data, readme.content);
    // console.log({newContents})
    await octokit.repos.createOrUpdateFileContents({
      ...REPO_DETAILS,
      content: newContents,
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

// function generateNewReadme (guests: Guest[], readme: string) {
function generateNewReadme(data, readme) {
  const renderedList = data
    .map(
      (x) =>
        `<li><a href="${x.url}">${x.title}</a>: ${x.reactions
          .map(
            (reaction) => `<img src=${reaction.user.avatar_url} width=100 />`
          )
          .join("")}</li>`
    )
    .join("\n");

  const listWithFences = `${START_COMMENT}
  ### Endorsements for
  
  <ul>
  ${renderedList}
  </ul>
  ${END_COMMENT}`;
  const newContent = readme.replace(listReg, listWithFences);
  // .replace(jsonReg, `<!--GUESTBOOK_LIST ${JSON.stringify(guests)}-->`)
  console.log({ newContent, listWithFences });
  return Buffer.from(newContent).toString("base64");
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
        url: x.url,
        number: x.number,
        reactions: reaction.data, // an array of USER
      };
    })
  );
  return data; // custom object
}
