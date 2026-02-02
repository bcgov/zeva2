# zeva2

npx husky install
npm pkg set scripts.prepare="husky"

npm pkg set scripts.prepare="husky"
npm run prepare
npx husky init

npm pkg set scripts.test="echo \"no tests\""

===
cat <<'EOF' > /Users/kfan/Projects/zeva2/package.json
{
"name": "zeva2",
"version": "1.0.0",
"private": true,
"scripts": {
"prepare": "husky"
},
"devDependencies": {
"husky": "^9.1.7",
"@commitlint/cli": "^19.0.0",
"@commitlint/config-conventional": "^19.0.0"
}
}
EOF

npm install
npx husky init

cat <<'EOF' > .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/\_/husky.sh"

npx commitlint --edit "$1"
EOF
