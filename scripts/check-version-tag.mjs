#!/usr/bin/env bun

/**
 * Version guard for CI.
 *
 * Behaviours:
 * - On tag refs (GITHUB_REF_NAME present): fail if package.json version != tag (accepts vX.Y.Z or X.Y.Z).
 * - On non-tag refs: compare package.json version to latest semver tag in repo.
 *   - If no tags exist, succeed.
 *   - If package version is greater than latest tag, fail (prevents untagged version bumps).
 *   - If package version is equal or lower, succeed.
 */

import { readFileSync } from "fs";
import { execSync } from "child_process";

const pkgVersion = JSON.parse(readFileSync("package.json", "utf8")).version;

const refName =
	process.env.GITHUB_REF_NAME ||
	process.env.TAG_NAME ||
	(process.env.GITHUB_REF ? process.env.GITHUB_REF.split("/").pop() : "");

const normalize = (v) => (v?.startsWith("v") ? v.slice(1) : v || "");
const isSemver = (v) => /^\d+\.\d+\.\d+$/.test(v);

const cmpSemver = (a, b) => {
	const [ma, mi, pa] = a.split(".").map(Number);
	const [mb, mb2, pb] = b.split(".").map(Number);
	if (ma !== mb) return ma - mb;
	if (mi !== mb2) return mi - mb2;
	return pa - pb;
};

const tagRefVersion = normalize(refName);

if (tagRefVersion && isSemver(tagRefVersion)) {
	// This is a valid semver tag, check version match
	if (pkgVersion !== tagRefVersion) {
		console.error(
			`Version mismatch on tag: package.json=${pkgVersion} vs tag=${tagRefVersion}. Align before releasing.`
		);
		process.exit(1);
	}
	console.log(`Version check passed: package.json=${pkgVersion} matches tag=${refName}.`);
	process.exit(0);
}

// Non-tag builds: ensure pkgVersion is not ahead of latest tag
let latestTag = "";
try {
	const out = execSync("git tag --list --sort=-v:refname", { encoding: "utf8" }).trim();
	latestTag = out.split("\n").find((t) => t.length > 0) || "";
} catch (err) {
	console.warn("Could not read git tags; skipping non-tag version guard.", err.message);
	process.exit(0);
}

const latestSemver = normalize(latestTag);

if (!latestSemver || !isSemver(latestSemver)) {
	console.log("No semver tags found; skipping non-tag version guard.");
	process.exit(0);
}

if (cmpSemver(pkgVersion, latestSemver) > 0) {
	console.error(
		`package.json version ${pkgVersion} is ahead of latest tag ${latestSemver}. Tag before merging/releasing.`
	);
	process.exit(1);
}

console.log(
	`Non-tag check passed: package.json=${pkgVersion} is not ahead of latest tag ${latestSemver}.`
);
