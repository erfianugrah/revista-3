import { execFileSync } from "child_process";

export function remarkModifiedTime() {
  return function (tree, file) {
    const filepath = file.history[0];
    const result = execFileSync("git", [
      "log",
      "-1",
      "--pretty=format:%cI",
      filepath,
    ]);
    file.data.astro.frontmatter.lastModified = result.toString();
  };
}
